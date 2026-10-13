const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/student', authenticateToken, authorizeRoles('STUDENT'), statsController.getStudentStats);
router.get('/company', authenticateToken, authorizeRoles('COMPANY', 'ADMIN'), statsController.getCompanyStats);
router.get('/admin', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), statsController.getAdminStats);

module.exports = router;
