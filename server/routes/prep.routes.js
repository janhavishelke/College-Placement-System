const express = require('express');
const router = express.Router();
const prepController = require('../controllers/prep.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Aptitude
router.get('/aptitude', authenticateToken, prepController.getAptitudeQuestions);
router.post('/aptitude/submit', authenticateToken, authorizeRoles('STUDENT'), prepController.submitAptitudeTest);
router.get('/aptitude/history', authenticateToken, authorizeRoles('STUDENT'), prepController.getAptitudeHistory);

// Coding
router.get('/coding', authenticateToken, prepController.getCodingChallenges);
router.get('/coding/:id', authenticateToken, prepController.getCodingChallengeById);
router.post('/coding/submit', authenticateToken, authorizeRoles('STUDENT'), prepController.submitCodingChallenge);

// Mock Interview
router.get('/mock-interview/questions', authenticateToken, prepController.getMockInterviewQuestions);
router.post('/mock-interview/evaluate', authenticateToken, authorizeRoles('STUDENT'), prepController.evaluateMockInterview);

// Company Guides
router.get('/guides', authenticateToken, prepController.getCompanyGuides);

// Readiness Dashboard
router.get('/readiness', authenticateToken, authorizeRoles('STUDENT'), prepController.getReadinessDashboard);

module.exports = router;
