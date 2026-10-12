const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/analyze', authenticateToken, resumeController.analyzeResume);
router.post('/save', authenticateToken, authorizeRoles('STUDENT'), resumeController.saveResume);
router.get('/my-resume', authenticateToken, authorizeRoles('STUDENT'), resumeController.getResume);

module.exports = router;
