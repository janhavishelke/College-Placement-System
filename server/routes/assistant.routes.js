const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistant.controller');
const { authenticateToken } = require('../middleware/auth');

router.post('/chat', authenticateToken, assistantController.askAssistant);

module.exports = router;
