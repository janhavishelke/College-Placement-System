const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/concepts
router.get('/', (req, res) => {
  try {
    const concepts = db.prepare('SELECT * FROM concepts ORDER BY id ASC').all();
    const formatted = concepts.map(c => ({
      ...c,
      prerequisites: JSON.parse(c.prerequisites || '[]')
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/concepts/:name
router.get('/:name', (req, res) => {
  try {
    const nameParam = decodeURIComponent(req.params.name).toLowerCase();
    const concept = db.prepare('SELECT * FROM concepts WHERE LOWER(name) = ?').get(nameParam);
    if (!concept) {
      return res.status(404).json({ error: 'Concept not found' });
    }
    res.json({
      ...concept,
      prerequisites: JSON.parse(concept.prerequisites || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
