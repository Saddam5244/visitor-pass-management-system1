const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { recordAuditLog } = require('../middleware/auditMiddleware');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_visitor_pass_jwt_key_2026_production_ready', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * @desc    Register a new user (Staff / Employee / Security / Admin)
 * @route   POST /api/auth/register
 * @access  Public (or Admin)
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, phone, organizationName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Role default is employee
    const assignedRole = role && ['admin', 'security', 'employee'].includes(role) ? role : 'employee';

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      department: department || 'Operations',
      phone: phone || '',
      organizationName: organizationName || 'Global HQ',
    });

    await recordAuditLog({
      req,
      action: 'USER_REGISTERED',
      resource: 'User',
      details: { userId: user._id, email: user.email, role: user.role },
      userId: user._id,
      userName: user.name,
      role: user.role,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organizationName: user.organizationName,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Authenticate User & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Admin.' });
    }

    const token = generateToken(user._id);

    await recordAuditLog({
      req,
      action: 'USER_LOGIN',
      resource: 'Auth',
      details: { email: user.email, role: user.role },
      userId: user._id,
      userName: user.name,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organizationName: user.organizationName,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      organizationName: req.user.organizationName,
      phone: req.user.phone,
    },
  });
};

/**
 * @desc    Get all employees/hosts for visitor registration dropdown
 * @route   GET /api/auth/hosts
 * @access  Public
 */
const getHosts = async (req, res) => {
  try {
    const hosts = await User.find({ isActive: true }).select('name email department role phone organizationName');
    return res.status(200).json({ success: true, count: hosts.length, hosts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private (Admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getHosts,
  getAllUsers,
};
