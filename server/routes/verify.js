const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Load tasks from dataset/verification.json
const datasetPath = path.resolve(__dirname, '../../dataset/verification.json');
let verificationTasks = [];
if (fs.existsSync(datasetPath)) {
  verificationTasks = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
}

// GET /api/verify/tasks
router.get('/tasks', (req, res) => {
  res.json(verificationTasks);
});

// GET /api/verify/task/:conceptName
router.get('/task/:conceptName', (req, res) => {
  const cName = decodeURIComponent(req.params.conceptName).toLowerCase();
  const task = verificationTasks.find(t => t.concept_name.toLowerCase() === cName) || verificationTasks[0];
  res.json(task);
});

// GET /api/verify/history
router.get('/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM verifications ORDER BY id DESC').all();
    const formatted = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      conceptName: r.concept_name,
      studentAnswer: r.student_answer,
      keyIdeas: JSON.parse(r.key_ideas || '[]'),
      ticks: JSON.parse(r.ticks || '[]'),
      gaps: JSON.parse(r.gaps || '[]'),
      createdAt: r.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/verify { conceptName, studentAnswer }
router.post('/', (req, res) => {
  try {
    const { conceptName, studentAnswer } = req.body;
    if (!conceptName || !studentAnswer) {
      return res.status(400).json({ error: 'conceptName and studentAnswer are required' });
    }

    const trimmedAns = studentAnswer.trim().toLowerCase();
    const task = verificationTasks.find(t => t.concept_name.toLowerCase() === conceptName.toLowerCase()) || verificationTasks[0];

    const keyIdeas = [];
    const ticks = [];
    const gaps = [];

    for (const idea of task.key_ideas) {
      keyIdeas.push(idea.text);
      // Check if any keyword matches
      const hasMatch = idea.keywords.some(kw => trimmedAns.includes(kw.toLowerCase()));
      ticks.push(hasMatch);
      if (!hasMatch) {
        gaps.push(idea.gap);
      }
    }

    const userId = 1;
    const now = new Date().toISOString();

    const insertVerif = db.prepare(`
      INSERT INTO verifications (user_id, concept_name, student_answer, key_ideas, ticks, gaps, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insertVerif.run(
      userId,
      task.concept_name,
      studentAnswer,
      JSON.stringify(keyIdeas),
      JSON.stringify(ticks),
      JSON.stringify(gaps),
      now
    );

    // If all ticks are true, and there is an active doubt for this concept, we can resolve it
    if (ticks.every(Boolean)) {
      db.prepare(`
        UPDATE doubts 
        SET status = 'resolved', resolved_at = ?
        WHERE user_id = ? AND LOWER(concept_name) = ? AND status != 'resolved'
      `).run(now, userId, task.concept_name.toLowerCase());
    }

    res.json({
      id: result.lastInsertRowid,
      conceptName: task.concept_name,
      prompt: task.prompt,
      studentAnswer,
      keyIdeas,
      ticks,
      gaps,
      createdAt: now
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
