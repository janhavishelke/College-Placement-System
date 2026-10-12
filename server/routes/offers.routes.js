const express = require('express');
const router = express.Router();
const offersController = require('../controllers/offers.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/compare', authenticateToken, offersController.compareOffers);
router.post('/save', authenticateToken, authorizeRoles('STUDENT'), offersController.saveOffer);
router.get('/my-offers', authenticateToken, authorizeRoles('STUDENT'), offersController.getSavedOffers);
router.delete('/:id', authenticateToken, authorizeRoles('STUDENT'), offersController.deleteSavedOffer);

module.exports = router;
