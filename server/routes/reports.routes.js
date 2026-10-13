const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Summary reports for dashboards
router.get('/summary', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), reportsController.getReportsSummary);

// CSV Data Exports (Placement Head & Admin)
router.get('/export/students', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), reportsController.exportStudentsCsv);
router.get('/export/drives', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), reportsController.exportDrivesCsv);
router.get('/export/selections', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), reportsController.exportSelectionsCsv);

module.exports = router;
