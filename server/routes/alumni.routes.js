const express = require('express');
const router = express.Router();
const alumniController = require('../controllers/alumni.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Interview Experiences
router.get('/experiences', authenticateToken, alumniController.getExperiences);
router.post('/experiences', authenticateToken, alumniController.submitExperience);
router.patch('/experiences/:id/moderate', authenticateToken, authorizeRoles('ADMIN'), alumniController.moderateExperience);

// Mentorship Queries
router.get('/mentorship', authenticateToken, alumniController.getMentorshipQueries);
router.post('/mentorship', authenticateToken, authorizeRoles('STUDENT'), alumniController.submitMentorshipQuery);
router.patch('/mentorship/:id/answer', authenticateToken, alumniController.answerMentorshipQuery);

module.exports = router;
