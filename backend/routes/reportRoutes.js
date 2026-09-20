const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAnalyticsData,
  exportReportCSV,
  getAuditLogs,
} = require('../controllers/reportController');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/analytics', authorizeRoles('admin', 'security'), getAnalyticsData);
router.get('/export/csv', authorizeRoles('admin', 'security'), exportReportCSV);
router.get('/audit-logs', authorizeRoles('admin'), getAuditLogs);

module.exports = router;
