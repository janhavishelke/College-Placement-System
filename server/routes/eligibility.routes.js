const express = require('express');
const router = express.Router();
const eligibilityController = require('../controllers/eligibility.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/job/:jobId', authenticateToken, authorizeRoles('STUDENT'), eligibilityController.checkJobEligibility);
router.get('/all', authenticateToken, authorizeRoles('STUDENT'), eligibilityController.checkAllDrivesEligibility);

module.exports = router;
