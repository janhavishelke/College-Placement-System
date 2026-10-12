const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timeline.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/application/:applicationId', authenticateToken, timelineController.getApplicationTimeline);
router.get('/calendar', authenticateToken, timelineController.getCalendarEvents);
router.get('/notifications', authenticateToken, timelineController.getNotifications);
router.patch('/notifications/:id/read', authenticateToken, timelineController.markNotificationRead);
router.patch('/notifications/read-all', authenticateToken, timelineController.markAllNotificationsRead);

module.exports = router;
