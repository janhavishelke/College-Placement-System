const express = require('express');
const router = express.Router();
const db = require('../db');

// Ensure study_alarms table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS study_alarms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    concept_name TEXT DEFAULT 'Recursion',
    scheduled_time TEXT NOT NULL,
    sound_enabled INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'ringing', 'completed', 'dismissed'
    created_at TEXT NOT NULL
  );
`);

// GET /api/alarms
router.get('/', (req, res) => {
  try {
    const userId = parseInt(req.query.userId || '1', 10);
    const alarms = db.prepare(`
      SELECT * FROM study_alarms 
      WHERE user_id = ? 
      ORDER BY scheduled_time ASC
    `).all(userId);

    const formatted = alarms.map(a => ({
      id: a.id,
      userId: a.user_id,
      title: a.title,
      conceptName: a.concept_name,
      scheduledTime: a.scheduled_time,
      soundEnabled: Boolean(a.sound_enabled),
      status: a.status,
      createdAt: a.created_at
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alarms (Create new study alarm)
router.post('/', (req, res) => {
  try {
    const { title, scheduledTime, conceptName = 'Recursion', soundEnabled = true, userId = 1 } = req.body;
    if (!title || !scheduledTime) {
      return res.status(400).json({ error: 'title and scheduledTime are required' });
    }

    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO study_alarms (user_id, title, concept_name, scheduled_time, sound_enabled, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `);

    const result = insert.run(
      userId,
      title.trim(),
      conceptName.trim(),
      scheduledTime,
      soundEnabled ? 1 : 0,
      now
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      userId,
      title,
      conceptName,
      scheduledTime,
      soundEnabled: Boolean(soundEnabled),
      status: 'active',
      createdAt: now
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alarms/:id (Update status or snooze)
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, snoozeMinutes } = req.body;

    if (snoozeMinutes) {
      const current = db.prepare('SELECT scheduled_time FROM study_alarms WHERE id = ?').get(id);
      if (!current) return res.status(404).json({ error: 'Alarm not found' });

      const newTime = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
      db.prepare(`
        UPDATE study_alarms 
        SET scheduled_time = ?, status = 'active'
        WHERE id = ?
      `).run(newTime, id);

      return res.json({ id, scheduledTime: newTime, status: 'active', message: `Snoozed for ${snoozeMinutes} minutes` });
    }

    if (status) {
      db.prepare('UPDATE study_alarms SET status = ? WHERE id = ?').run(status, id);
      return res.json({ id, status });
    }

    res.status(400).json({ error: 'No update parameters provided' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/alarms/:id
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    db.prepare('DELETE FROM study_alarms WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
