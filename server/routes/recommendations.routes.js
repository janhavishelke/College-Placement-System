const express = require('express');
const router = express.Router();
const recommendationsController = require('../controllers/recommendations.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/jobs', authenticateToken, authorizeRoles('STUDENT'), recommendationsController.getRecommendations);
router.get('/skill-gap', authenticateToken, authorizeRoles('STUDENT'), recommendationsController.getSkillGap);

module.exports = router;
