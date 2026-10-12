const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companies.controller');
const { authenticateToken, optionalAuthenticate, authorizeRoles } = require('../middleware/auth');

// Public or optionally authenticated (attaches student applied status if token present)
router.get('/', optionalAuthenticate, companiesController.getVisitingCompanies);
router.get('/visiting', optionalAuthenticate, companiesController.getVisitingCompanies);
router.get('/:id', optionalAuthenticate, companiesController.getCompanyById);

// Admin & Company CRUD operations
router.post('/', authenticateToken, authorizeRoles('COMPANY', 'ADMIN'), companiesController.createCompanyDrive);
router.put('/:id', authenticateToken, authorizeRoles('COMPANY', 'ADMIN'), companiesController.updateCompanyDrive);
router.delete('/:id', authenticateToken, authorizeRoles('COMPANY', 'ADMIN'), companiesController.deleteCompanyDrive);

module.exports = router;
