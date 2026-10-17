const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/profile/confusion-fingerprint (Feature 3: Confusion Fingerprint)
router.get('/confusion-fingerprint', (req, res) => {
  try {
    const userId = parseInt(req.query.userId || '1', 10);
    const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(userId) || { id: 1, name: 'Alex Rivera' };

    const profiles = db.prepare(`
      SELECT * FROM learning_profiles 
      WHERE user_id = ? 
      ORDER BY 
        CASE status 
          WHEN 'needs_practice' THEN 1
          WHEN 'needs_reassessment' THEN 2
          WHEN 'improving' THEN 3
          WHEN 'demonstrated_understanding' THEN 4
          ELSE 5
        END ASC
    `).all(userId);

    const formatted = profiles.map(p => ({
      id: p.id,
      conceptName: p.concept_name,
      status: p.status,
      struggleCount: p.struggle_count,
      correctCount: p.correct_count,
      reasoningErrors: JSON.parse(p.reasoning_errors_json || '[]'),
      lastAssessedAt: p.last_assessed_at,
      notes: p.notes
    }));

    // Status breakdown summary
    const summary = {
      totalConcepts: profiles.length,
      demonstratedUnderstanding: profiles.filter(p => p.status === 'demonstrated_understanding').length,
      improving: profiles.filter(p => p.status === 'improving').length,
      needsPractice: profiles.filter(p => p.status === 'needs_practice').length,
      needsReassessment: profiles.filter(p => p.status === 'needs_reassessment').length,
      notAssessed: profiles.filter(p => p.status === 'not_assessed').length
    };

    res.json({
      user,
      summary,
      concepts: formatted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profile/concept-status (Inspect & Correct Learning Profile)
router.patch('/concept-status', (req, res) => {
  try {
    const { userId = 1, conceptName, newStatus, studentNote } = req.body;
    if (!conceptName || !newStatus) {
      return res.status(400).json({ error: 'conceptName and newStatus are required' });
    }

    const validStatuses = ['not_assessed', 'needs_practice', 'improving', 'demonstrated_understanding', 'needs_reassessment'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM learning_profiles WHERE user_id = ? AND LOWER(concept_name) = ?').get(userId, conceptName.toLowerCase());

    if (existing) {
      db.prepare(`
        UPDATE learning_profiles 
        SET status = ?, notes = COALESCE(?, notes), last_assessed_at = ?
        WHERE id = ?
      `).run(newStatus, studentNote || null, now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO learning_profiles (user_id, concept_name, status, notes, last_assessed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, conceptName, newStatus, studentNote || 'Self-adjusted by student', now, now);
    }

    res.json({
      success: true,
      conceptName,
      status: newStatus,
      message: `Updated learning status for "${conceptName}" to "${newStatus}".`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/reset (Reset Learning Profile)
router.post('/reset', (req, res) => {
  try {
    const { userId = 1, conceptName } = req.body;
    if (conceptName) {
      db.prepare(`
        UPDATE learning_profiles 
        SET status = 'not_assessed', struggle_count = 0, correct_count = 0, reasoning_errors_json = '[]'
        WHERE user_id = ? AND LOWER(concept_name) = ?
      `).run(userId, conceptName.toLowerCase());
    } else {
      db.prepare(`
        UPDATE learning_profiles 
        SET status = 'not_assessed', struggle_count = 0, correct_count = 0, reasoning_errors_json = '[]'
        WHERE user_id = ?
      `).run(userId);
    }

    res.json({
      success: true,
      message: conceptName ? `Reset profile for "${conceptName}".` : 'Full learning profile reset to initial unassessed state.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
