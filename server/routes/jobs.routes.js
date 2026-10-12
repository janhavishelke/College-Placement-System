const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');
const { authenticateToken, optionalAuthenticate, authorizeRoles } = require('../middleware/auth');

// Public or optionally authenticated
router.get('/', optionalAuthenticate, jobsController.getAllJobs);
router.get('/:id', jobsController.getJobById);

// Company & Admin only
router.post('/', authenticateToken, authorizeRoles('COMPANY', 'ADMIN'), jobsController.createJob);
router.delete('/:id', authenticateToken, authorizeRoles('COMPANY', 'ADMIN'), jobsController.deleteJob);

module.exports = router;
