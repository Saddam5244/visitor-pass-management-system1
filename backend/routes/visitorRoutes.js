const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  requestVisitorOTP,
  verifyVisitorOTP,
  registerVisitor,
  uploadVisitorPhoto,
  getAllVisitors,
} = require('../controllers/visitorController');

router.post('/otp/request', requestVisitorOTP);
router.post('/otp/verify', verifyVisitorOTP);
router.post('/register', registerVisitor);
router.post('/upload-photo', upload.single('photo'), uploadVisitorPhoto);
router.get('/', protect, authorizeRoles('admin', 'security'), getAllVisitors);

module.exports = router;
