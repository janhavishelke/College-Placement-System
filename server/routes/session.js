const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/session
router.get('/', (req, res) => {
  try {
    const userId = 1;
    let session = db.prepare('SELECT * FROM learning_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);

    if (!session) {
      const now = new Date().toISOString();
      const insert = db.prepare(`
        INSERT INTO learning_sessions (user_id, doc_id, page_no, active_concept, lesson_step, updated_at)
        VALUES (?, 1, 2, 'Recursion', 'reading', ?)
      `);
      const result = insert.run(userId, now);
      session = db.prepare('SELECT * FROM learning_sessions WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json({
      id: session.id,
      userId: session.user_id,
      docId: session.doc_id,
      pageNo: session.page_no,
      selectedPassage: session.selected_passage,
      activeConcept: session.active_concept,
      lessonStep: session.lesson_step,
      unresolvedQuestion: session.unresolved_question,
      updatedAt: session.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/session
router.post('/', (req, res) => {
  try {
    const userId = 1;
    const { docId, pageNo, selectedPassage, activeConcept, lessonStep, unresolvedQuestion } = req.body;
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT id FROM learning_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);

    if (existing) {
      db.prepare(`
        UPDATE learning_sessions
        SET doc_id = COALESCE(?, doc_id),
            page_no = COALESCE(?, page_no),
            selected_passage = COALESCE(?, selected_passage),
            active_concept = COALESCE(?, active_concept),
            lesson_step = COALESCE(?, lesson_step),
            unresolved_question = COALESCE(?, unresolved_question),
            updated_at = ?
        WHERE id = ?
      `).run(docId, pageNo, selectedPassage, activeConcept, lessonStep, unresolvedQuestion, now, existing.id);

      const updated = db.prepare('SELECT * FROM learning_sessions WHERE id = ?').get(existing.id);
      res.json(updated);
    } else {
      const insert = db.prepare(`
        INSERT INTO learning_sessions (user_id, doc_id, page_no, selected_passage, active_concept, lesson_step, unresolved_question, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = insert.run(userId, docId || 1, pageNo || 2, selectedPassage || null, activeConcept || 'Recursion', lessonStep || 'reading', unresolvedQuestion || null, now);
      const created = db.prepare('SELECT * FROM learning_sessions WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
