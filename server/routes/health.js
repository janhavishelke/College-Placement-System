const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const user = db.prepare('SELECT id, name FROM users WHERE id = 1').get();
    const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const pageCount = db.prepare('SELECT COUNT(*) as count FROM pages').get();
    const doubtsCount = db.prepare('SELECT COUNT(*) as count FROM doubts').get();

    res.json({
      ok: true,
      user,
      counts: {
        documents: docCount.count,
        pages: pageCount.count,
        doubts: doubtsCount.count
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
