const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAppointments,
  inviteVisitor,
  approveAppointment,
  rejectAppointment,
} = require('../controllers/appointmentController');

router.use(protect);

router.get('/', getAppointments);
router.post('/invite', authorizeRoles('employee', 'admin'), inviteVisitor);
router.put('/:id/approve', authorizeRoles('employee', 'admin', 'security'), approveAppointment);
router.put('/:id/reject', authorizeRoles('employee', 'admin', 'security'), rejectAppointment);

module.exports = router;
