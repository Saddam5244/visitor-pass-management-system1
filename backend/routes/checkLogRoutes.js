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

router.post('/check-in', authorizeRoles('security', 'admin', 'employee'), scanCheckIn);
router.post('/check-out', authorizeRoles('security', 'admin', 'employee'), scanCheckOut);
router.get('/inside', authorizeRoles('security', 'admin', 'employee'), getCurrentlyInside);
router.get('/', authorizeRoles('security', 'admin', 'employee'), getCheckLogs);

module.exports = router;
