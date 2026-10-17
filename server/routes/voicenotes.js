const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/voicenotes/save
router.post('/save', (req, res) => {
  try {
    const { title, transcript } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript cannot be empty' });
    }

    const noteTitle = title || `Voice Memo - ${new Date().toLocaleDateString()}`;
    const now = new Date().toISOString();

    const insertTx = db.transaction(() => {
      const docResult = db.prepare(`
        INSERT INTO documents (title, filename, page_count, uploaded_at)
        VALUES (?, 'voice_memo.txt', 1, ?)
      `).run(noteTitle, now);
      const docId = docResult.lastInsertRowid;

      db.prepare(`
        INSERT INTO pages (doc_id, page_no, text)
        VALUES (?, 1, ?)
      `).run(docId, transcript.trim());

      return docId;
    });

    const docId = insertTx();

    res.status(201).json({
      success: true,
      docId,
      title: noteTitle,
      transcript: transcript.trim(),
      message: "Voice note saved as study material"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
