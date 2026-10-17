const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/artifacts
router.get('/', (req, res) => {
  try {
    const concepts = db.prepare('SELECT * FROM concepts').all();
    const pages = db.prepare('SELECT * FROM pages WHERE doc_id = 1 ORDER BY page_no ASC').all();

    // Source-grounded flashcards
    const flashcards = concepts.map((c, i) => ({
      id: c.id,
      front: `What is ${c.name}?`,
      back: c.definition,
      pageNo: c.page_no,
      docId: c.doc_id,
      example: c.visual_example
    }));

    // Source-grounded study guide key points
    const keyPoints = pages.map(p => {
      const firstLine = p.text.split('\n')[0] || `Page ${p.page_no}`;
      return {
        pageNo: p.page_no,
        title: firstLine,
        summary: p.text.slice(0, 180) + '...'
      };
    });

    res.json({
      flashcards,
      keyPoints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
