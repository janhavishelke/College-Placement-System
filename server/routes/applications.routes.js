const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applications.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Student submits an application
router.post('/', authenticateToken, authorizeRoles('STUDENT'), applicationsController.applyToJob);

// Student gets their own applications
router.get('/student', authenticateToken, authorizeRoles('STUDENT'), applicationsController.getStudentApplications);

// Company, Coordinator, Placement Head, Admin gets applications
router.get('/company', authenticateToken, authorizeRoles('COMPANY', 'ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), applicationsController.getCompanyApplications);

// Company, Coordinator, Placement Head, Admin updates application status (All 8 stages)
router.patch('/:id/status', authenticateToken, authorizeRoles('COMPANY', 'ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), applicationsController.updateApplicationStatus);
router.put('/:id/status', authenticateToken, authorizeRoles('COMPANY', 'ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), applicationsController.updateApplicationStatus);

// Student accepts or declines a received job offer (only when Selected)
router.patch('/:id/respond-offer', authenticateToken, authorizeRoles('STUDENT'), applicationsController.respondToOffer);

module.exports = router;
