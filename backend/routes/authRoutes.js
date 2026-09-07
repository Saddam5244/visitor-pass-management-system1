const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getHosts, getAllUsers } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/hosts', getHosts);
router.get('/users', protect, authorizeRoles('admin'), getAllUsers);

module.exports = router;
