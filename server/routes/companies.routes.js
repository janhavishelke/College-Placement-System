const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companies.controller');
const { authenticateToken, optionalAuthenticate, authorizeRoles } = require('../middleware/auth');

// Public or optionally authenticated (attaches student applied status if token present)
router.get('/', optionalAuthenticate, companiesController.getVisitingCompanies);
router.get('/visiting', optionalAuthenticate, companiesController.getVisitingCompanies);
router.get('/:id', optionalAuthenticate, companiesController.getCompanyById);

// Admin, Placement Head, Coordinator & Company CRUD operations
router.post('/', authenticateToken, authorizeRoles('COMPANY', 'ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), companiesController.createCompanyDrive);
router.put('/:id', authenticateToken, authorizeRoles('COMPANY', 'ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), companiesController.updateCompanyDrive);
router.delete('/:id', authenticateToken, authorizeRoles('COMPANY', 'ADMIN', 'PLACEMENT_HEAD'), companiesController.deleteCompanyDrive);

module.exports = router;
