const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Audit logs (Placement Head & Admin only)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), auditController.getAuditLogs);

module.exports = router;
