const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applications.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Student submits an application
router.post('/', authenticateToken, authorizeRoles('STUDENT'), applicationsController.applyToJob);

// Student gets their own applications
router.get('/student', authenticateToken, authorizeRoles('STUDENT'), applicationsController.getStudentApplications);

// Company gets applications for their jobs (or Admin gets all)
router.get('/company', authenticateToken, authorizeRoles('COMPANY', 'ADMIN'), applicationsController.getCompanyApplications);

// Company or Admin updates application status (All 8 stages)
router.patch('/:id/status', authenticateToken, authorizeRoles('COMPANY', 'ADMIN'), applicationsController.updateApplicationStatus);

// Student accepts or declines a received job offer (only when Selected)
router.patch('/:id/respond-offer', authenticateToken, authorizeRoles('STUDENT'), applicationsController.respondToOffer);

module.exports = router;
