const express = require('express');
const router = express.Router();
const announcementsController = require('../controllers/announcements.controller');
const { authenticateToken, optionalAuthenticate, authorizeRoles } = require('../middleware/auth');

// Public or logged-in users view announcements
router.get('/', optionalAuthenticate, announcementsController.getAnnouncements);

// Placement Head, Coordinators, Admin publish announcements
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), announcementsController.createAnnouncement);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR'), announcementsController.deleteAnnouncement);

module.exports = router;
