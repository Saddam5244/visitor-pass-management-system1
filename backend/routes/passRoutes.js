const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getPassById,
  getPassByNumber,
  verifyQRPayload,
  downloadPassPDF,
  getAllPasses,
} = require('../controllers/passController');

// Public lookup routes for visitors to see & download pass
router.get('/:id/pdf', downloadPassPDF);
router.get('/number/:passNumber', getPassByNumber);
router.get('/:id', getPassById);

// Protected routes
router.post('/verify-qr', protect, authorizeRoles('security', 'admin'), verifyQRPayload);
router.get('/', protect, authorizeRoles('security', 'admin', 'employee'), getAllPasses);

module.exports = router;
