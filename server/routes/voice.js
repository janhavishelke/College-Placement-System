const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Load voice scripts from dataset/voice.json
const datasetPath = path.resolve(__dirname, '../../dataset/voice.json');
let voiceScripts = [];
if (fs.existsSync(datasetPath)) {
  voiceScripts = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
}

// GET /api/voice/scripts
router.get('/scripts', (req, res) => {
  res.json(voiceScripts);
});

// GET /api/voice/script/:conceptName
router.get('/script/:conceptName', (req, res) => {
  const cName = decodeURIComponent(req.params.conceptName).toLowerCase();
  const script = voiceScripts.find(s => s.concept_name.toLowerCase() === cName) || voiceScripts[0];
  res.json(script);
});

// POST /api/voice/start { conceptName }
router.post('/start', (req, res) => {
  try {
    const { conceptName } = req.body;
    const finalConcept = conceptName || 'Recursion';
    const userId = 1;
    const now = new Date().toISOString();

    const script = voiceScripts.find(s => s.concept_name.toLowerCase() === finalConcept.toLowerCase()) || voiceScripts[0];

    const insertSession = db.prepare(`
      INSERT INTO voice_sessions (user_id, concept_name, chunk_index, bookmark, status, created_at, updated_at)
      VALUES (?, ?, 0, 0, 'speaking', ?, ?)
    `);
    const result = insertSession.run(userId, finalConcept, now, now);
    const sessionId = result.lastInsertRowid;

    res.json({
      sessionId,
      conceptName: finalConcept,
      chunks: script.chunks,
      chunkIndex: 0,
      bookmark: 0,
      status: 'speaking'
    });
  } catch (err) {
    console.error('Voice start error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/voice/pause { sessionId, chunkIndex, interruption }
router.post('/pause', (req, res) => {
  try {
    const { sessionId, chunkIndex, interruption } = req.body;
    if (!sessionId && sessionId !== 0) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const cIdx = chunkIndex !== undefined ? parseInt(chunkIndex, 10) : 0;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE voice_sessions
      SET chunk_index = ?, bookmark = ?, status = 'paused', last_interruption = ?, updated_at = ?
      WHERE id = ?
    `).run(cIdx, cIdx, interruption || null, now, sessionId);

    const session = db.prepare('SELECT * FROM voice_sessions WHERE id = ?').get(sessionId);

    // Look up answer for the interruption if provided
    let answer = null;
    let citations = [];
    if (interruption) {
      // Find matching QA
      const qaList = db.prepare('SELECT * FROM qa_pairs').all();
      const lower = interruption.toLowerCase();
      let best = null;
      for (const qa of qaList) {
        if (lower.includes('base case') && qa.question.toLowerCase().includes('base case')) {
          best = qa;
          break;
        } else if (lower.includes('recursion') && qa.question.toLowerCase().includes('recursion')) {
          best = qa;
          break;
        } else if (lower.includes('call stack') && qa.question.toLowerCase().includes('call stack')) {
          best = qa;
          break;
        }
      }
      if (!best) best = qaList[0];

      answer = best.answer;
      if (best.page_no && best.doc_id) {
        citations.push({
          docId: best.doc_id,
          pageNo: best.page_no,
          excerpt: best.excerpt || ''
        });
      }
    }

    res.json({
      sessionId: session.id,
      status: 'paused',
      bookmark: session.bookmark,
      chunkIndex: session.chunk_index,
      interruption: session.last_interruption,
      interruptionAnswer: answer,
      citations
    });
  } catch (err) {
    console.error('Voice pause error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/voice/resume { sessionId }
router.post('/resume', (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId && sessionId !== 0) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = db.prepare('SELECT * FROM voice_sessions WHERE id = ?').get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Voice session not found' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE voice_sessions
      SET status = 'resumed', updated_at = ?
      WHERE id = ?
    `).run(now, sessionId);

    const script = voiceScripts.find(s => s.concept_name.toLowerCase() === session.concept_name.toLowerCase()) || voiceScripts[0];

    res.json({
      sessionId: session.id,
      conceptName: session.concept_name,
      chunks: script.chunks,
      bookmark: session.bookmark, // Frontend resumes from bookmark, not from start!
      status: 'resumed'
    });
  } catch (err) {
    console.error('Voice resume error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
