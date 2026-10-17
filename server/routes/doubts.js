const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/doubts?status=
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT d.*, c.definition, c.doc_id, c.page_no, c.simpler_explanation, c.visual_example
      FROM doubts d
      LEFT JOIN concepts c ON d.concept_id = c.id OR LOWER(d.concept_name) = LOWER(c.name)
    `;
    const params = [];
    if (status) {
      query += ' WHERE d.status = ?';
      params.push(status);
    }
    query += ' ORDER BY d.id DESC';

    const rows = db.prepare(query).all(...params);
    const doubts = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      conceptName: r.concept_name,
      conceptId: r.concept_id,
      status: r.status,
      stepsDone: JSON.parse(r.steps_done || '[]'),
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
      definition: r.definition,
      docId: r.doc_id,
      pageNo: r.page_no,
      simplerExplanation: r.simpler_explanation,
      visualExample: r.visual_example
    }));

    res.json(doubts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/doubts { conceptName }
router.post('/', (req, res) => {
  try {
    let { conceptName } = req.body;
    if (!conceptName || !conceptName.trim()) {
      return res.status(400).json({ error: 'conceptName is required' });
    }

    const trimmed = conceptName.trim();
    let matchedConcept = null;

    // Detect if student typed a full sentence like "I still don't understand recursion"
    const concepts = db.prepare('SELECT * FROM concepts').all();
    for (const c of concepts) {
      if (trimmed.toLowerCase().includes(c.name.toLowerCase())) {
        matchedConcept = c;
        break;
      }
    }

    const finalName = matchedConcept ? matchedConcept.name : trimmed;
    const conceptId = matchedConcept ? matchedConcept.id : null;
    const now = new Date().toISOString();
    const userId = 1;

    const insertDoubt = db.prepare(`
      INSERT INTO doubts (user_id, concept_name, concept_id, status, steps_done, created_at)
      VALUES (?, ?, ?, 'unresolved', '[]', ?)
    `);
    const result = insertDoubt.run(userId, finalName, conceptId, now);

    res.status(201).json({
      id: result.lastInsertRowid,
      userId,
      conceptName: finalName,
      conceptId,
      status: 'unresolved',
      stepsDone: [],
      createdAt: now,
      resolvedAt: null,
      docId: matchedConcept?.doc_id || 1,
      pageNo: matchedConcept?.page_no || 2,
      simplerExplanation: matchedConcept?.simpler_explanation || '',
      visualExample: matchedConcept?.visual_example || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/doubts/:id { step: "simpler"|"visual"|"practice" }
router.patch('/:id', (req, res) => {
  try {
    const doubtId = parseInt(req.params.id, 10);
    const { step } = req.body;

    const doubt = db.prepare('SELECT * FROM doubts WHERE id = ?').get(doubtId);
    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    const steps = JSON.parse(doubt.steps_done || '[]');
    if (step && !steps.includes(step)) {
      steps.push(step);
    }

    const newStatus = steps.length >= 3 ? 'resolving' : 'resolving';
    db.prepare(`
      UPDATE doubts 
      SET steps_done = ?, status = ?
      WHERE id = ?
    `).run(JSON.stringify(steps), newStatus, doubtId);

    const updated = db.prepare('SELECT * FROM doubts WHERE id = ?').get(doubtId);
    res.json({
      ...updated,
      stepsDone: JSON.parse(updated.steps_done)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/doubts/:id/resolve
router.patch('/:id/resolve', (req, res) => {
  try {
    const doubtId = parseInt(req.params.id, 10);
    const doubt = db.prepare('SELECT * FROM doubts WHERE id = ?').get(doubtId);
    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    const now = new Date().toISOString();
    const steps = JSON.parse(doubt.steps_done || '[]');
    if (!steps.includes('simpler')) steps.push('simpler');
    if (!steps.includes('visual')) steps.push('visual');
    if (!steps.includes('practice')) steps.push('practice');

    db.prepare(`
      UPDATE doubts 
      SET status = 'resolved', resolved_at = ?, steps_done = ?
      WHERE id = ?
    `).run(now, JSON.stringify(steps), doubtId);

    const updated = db.prepare('SELECT * FROM doubts WHERE id = ?').get(doubtId);
    res.json({
      ...updated,
      stepsDone: JSON.parse(updated.steps_done)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
