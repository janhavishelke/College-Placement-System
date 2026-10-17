const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Load rules from dataset/learning_interruptions.json
const datasetPath = path.resolve(__dirname, '../../dataset/learning_interruptions.json');
let rules = [];
if (fs.existsSync(datasetPath)) {
  rules = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
}

// GET /api/interruptions
router.get('/', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM interruptions ORDER BY id DESC').all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interruptions/check { conceptName }
router.post('/check', (req, res) => {
  try {
    const { conceptName } = req.body;
    const targetConcept = conceptName || 'Recursion';
    const userId = 1;

    // Fetch existing interruptions for this user to check what was shown/dismissed/accepted
    const existing = db.prepare('SELECT * FROM interruptions WHERE user_id = ?').all(userId);
    const handledRules = new Set(existing.map(i => i.rule));

    // Fetch recent verifications for targetConcept
    const verifs = db.prepare(`
      SELECT * FROM verifications 
      WHERE user_id = ? AND LOWER(concept_name) = ?
      ORDER BY id DESC
    `).all(userId, targetConcept.toLowerCase());

    // Count how many failed verifications (gaps.length > 0)
    let failureCount = 0;
    for (const v of verifs) {
      const gaps = JSON.parse(v.gaps || '[]');
      if (gaps.length > 0) {
        failureCount++;
      }
    }

    // Fetch doubts count for targetConcept
    const doubts = db.prepare(`
      SELECT * FROM doubts 
      WHERE user_id = ? AND LOWER(concept_name) = ?
    `).all(userId, targetConcept.toLowerCase());

    // Check passing verifications for Call Stack (prerequisite check)
    const callStackVerifs = db.prepare(`
      SELECT * FROM verifications 
      WHERE user_id = ? AND LOWER(concept_name) = 'call stack'
    `).all(userId);
    const hasPassedCallStack = callStackVerifs.some(v => {
      const gaps = JSON.parse(v.gaps || '[]');
      return gaps.length === 0;
    });

    let triggeredRule = null;

    // Rule 1: verification_gap_twice
    if (failureCount >= 2 && !handledRules.has('verification_gap_twice')) {
      triggeredRule = rules.find(r => r.rule === 'verification_gap_twice') || {
        rule: 'verification_gap_twice',
        trigger_evidence: 'Failed verification on the same concept twice with a missing base case.',
        suggestion_text: 'You missed the base case twice. Want a 1-minute review of call stack first?'
      };
    } 
    // Rule 2: same_doubt_asked_twice
    else if (doubts.length >= 2 && !handledRules.has('same_doubt_asked_twice')) {
      triggeredRule = rules.find(r => r.rule === 'same_doubt_asked_twice') || {
        rule: 'same_doubt_asked_twice',
        trigger_evidence: 'Student logged multiple unresolved doubts on recursion mechanics.',
        suggestion_text: 'You asked about recursion again. Would an interactive visual stack diagram help?'
      };
    }
    // Rule 3: missing_prerequisite (failed recursion but never verified call stack)
    else if (failureCount >= 1 && !hasPassedCallStack && !handledRules.has('missing_prerequisite')) {
      triggeredRule = rules.find(r => r.rule === 'missing_prerequisite') || {
        rule: 'missing_prerequisite',
        trigger_evidence: 'Student struggled with recursion but has no passing verification for call stack.',
        suggestion_text: 'Recursion relies directly on the Call Stack. Review Call Stack before continuing?'
      };
    }

    if (!triggeredRule) {
      return res.json(null);
    }

    const now = new Date().toISOString();
    const insertInt = db.prepare(`
      INSERT INTO interruptions (user_id, rule, trigger_evidence, suggestion_text, status, created_at)
      VALUES (?, ?, ?, ?, 'shown', ?)
    `);
    const result = insertInt.run(
      userId,
      triggeredRule.rule,
      triggeredRule.trigger_evidence,
      triggeredRule.suggestion_text,
      now
    );

    res.json({
      id: result.lastInsertRowid,
      userId,
      rule: triggeredRule.rule,
      triggerEvidence: triggeredRule.trigger_evidence,
      suggestionText: triggeredRule.suggestion_text,
      status: 'shown',
      createdAt: now
    });
  } catch (err) {
    console.error('Interruption check error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interruptions/:id/accept
router.post('/:id/accept', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    db.prepare("UPDATE interruptions SET status = 'accepted' WHERE id = ?").run(id);
    const updated = db.prepare('SELECT * FROM interruptions WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interruptions/:id/dismiss
router.post('/:id/dismiss', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    db.prepare("UPDATE interruptions SET status = 'dismissed' WHERE id = ?").run(id);
    const updated = db.prepare('SELECT * FROM interruptions WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
