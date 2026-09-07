const express = require('express');
const router = express.Router();
const { getRecentNotifications } = require('../utils/notificationHelper');
const { protect } = require('../middleware/authMiddleware');

// Get recent in-system notifications (Email/SMS logs from MongoDB)
router.get('/recent', protect, async (req, res) => {
  const notifications = await getRecentNotifications();
  return res.status(200).json({
    success: true,
    count: notifications.length,
    notifications,
  });
});

module.exports = router;
