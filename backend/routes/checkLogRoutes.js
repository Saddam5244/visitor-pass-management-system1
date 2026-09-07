const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  scanCheckIn,
  scanCheckOut,
  getCurrentlyInside,
  getCheckLogs,
} = require('../controllers/checkLogController');

router.use(protect);

router.post('/check-in', authorizeRoles('security', 'admin'), scanCheckIn);
router.post('/check-out', authorizeRoles('security', 'admin'), scanCheckOut);
router.get('/inside', authorizeRoles('security', 'admin', 'employee'), getCurrentlyInside);
router.get('/', authorizeRoles('security', 'admin'), getCheckLogs);

module.exports = router;
