const Pass = require('../models/Pass');
const Appointment = require('../models/Appointment');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { generatePassPDF } = require('../utils/pdfGenerator');

/**
 * @desc    Get Pass details by ID
 * @route   GET /api/passes/:id
 * @access  Public (or Protected)
 */
const getPassById = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate('visitorId')
      .populate('hostId', 'name email department phone organizationName')
      .populate('appointmentId')
      .populate('organizationId');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    return res.status(200).json({ success: true, pass });
  } catch (err) {
    console.error('Get pass error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Lookup Pass by Pass Number (e.g. VP-2026-12345)
 * @route   GET /api/passes/number/:passNumber
 * @access  Public
 */
const getPassByNumber = async (req, res) => {
  try {
    const pass = await Pass.findOne({ passNumber: req.params.passNumber.toUpperCase().trim() })
      .populate('visitorId')
      .populate('hostId', 'name email department phone organizationName')
      .populate('appointmentId')
      .populate('organizationId');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Visitor Pass not found' });
    }

    return res.status(200).json({ success: true, pass });
  } catch (err) {
    console.error('Lookup pass error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Verify QR token or JSON payload
 * @route   POST /api/passes/verify-qr
 * @access  Private (Security, Admin)
 */
const verifyQRPayload = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ success: false, message: 'QR data string is required' });
    }

    let passNumber = qrData.trim();

    // Check if qrData is a JSON string
    if (qrData.startsWith('{')) {
      try {
        const parsed = JSON.parse(qrData);
        passNumber = parsed.passNumber || parsed.qrToken || passNumber;
      } catch (e) {
        // Not JSON, continue with raw string
      }
    }

    const pass = await Pass.findOne({
      $or: [{ passNumber: passNumber.toUpperCase() }, { qrToken: passNumber }],
    })
      .populate('visitorId')
      .populate('hostId', 'name email department phone organizationName')
      .populate('appointmentId')
      .populate('organizationId');

    if (!pass) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid or unrecognized QR code. Pass not found in system.',
      });
    }

    const now = new Date();
    const isExpired = new Date(pass.validTo) < now;

    return res.status(200).json({
      success: true,
      valid: !isExpired && pass.status !== 'CANCELLED',
      isExpired,
      status: pass.status,
      pass,
    });
  } catch (err) {
    console.error('Verify QR error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Download Printable Pass PDF Badge
 * @route   GET /api/passes/:id/pdf
 * @access  Public
 */
const downloadPassPDF = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate('visitorId')
      .populate('hostId')
      .populate('organizationId');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=VisitorBadge-${pass.passNumber}.pdf`);

    await generatePassPDF(
      {
        pass,
        visitor: pass.visitorId,
        host: pass.hostId,
        organization: pass.organizationId,
      },
      res
    );
  } catch (err) {
    console.error('Generate PDF error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all passes with filters
 * @route   GET /api/passes
 * @access  Private (Security, Admin, Employee)
 */
const getAllPasses = async (req, res) => {
  try {
    const { status, date, search } = req.query;
    let query = {};

    if (req.user.role === 'employee') {
      query.hostId = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.passNumber = { $regex: search, $options: 'i' };
    }

    const passes = await Pass.find(query)
      .populate('visitorId', 'fullName email phone company photoUrl')
      .populate('hostId', 'name department')
      .populate('organizationId', 'name')
      .sort('-createdAt')
      .limit(100);

    return res.status(200).json({
      success: true,
      count: passes.length,
      passes,
    });
  } catch (err) {
    console.error('Get all passes error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPassById,
  getPassByNumber,
  verifyQRPayload,
  downloadPassPDF,
  getAllPasses,
};
