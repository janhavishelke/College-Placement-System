const express = require('express');
const router = express.Router();
const coordinatorsController = require('../controllers/coordinators.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Coordinator personal dashboard stats
router.get('/stats', authenticateToken, authorizeRoles('COORDINATOR', 'PLACEMENT_HEAD', 'ADMIN'), coordinatorsController.getCoordinatorStats);

// Placement Head / Admin can list, create, update, delete coordinators
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), coordinatorsController.getCoordinators);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), coordinatorsController.createCoordinator);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), coordinatorsController.updateCoordinator);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD'), coordinatorsController.deleteCoordinator);

module.exports = router;
