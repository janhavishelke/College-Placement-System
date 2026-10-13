const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');
const { authenticateToken, optionalAuthenticate, authorizeRoles } = require('../middleware/auth');

// Public or optionally authenticated
router.get('/', optionalAuthenticate, jobsController.getAllJobs);
router.get('/:id', optionalAuthenticate, jobsController.getJobById);

// Company, Coordinator, Placement Head, Admin
router.post('/', authenticateToken, authorizeRoles('COMPANY', 'ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), jobsController.createJob);
router.put('/:id', authenticateToken, authorizeRoles('COMPANY', 'ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), jobsController.updateJob);
router.delete('/:id', authenticateToken, authorizeRoles('COMPANY', 'ADMIN', 'PLACEMENT_HEAD'), jobsController.deleteJob);

// Placement Head Approval & Coordination Workflow routes
router.post('/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), jobsController.approveDrive);
router.post('/:id/reject', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), jobsController.rejectDrive);
router.post('/:id/assign-coordinator', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), jobsController.assignCoordinator);
router.post('/:id/archive', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), jobsController.archiveDrive);

module.exports = router;
