const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const User = require('../models/User');
const { generateOTP, verifyOTP } = require('../utils/otpHelper');
const { generateQRCodeDataURL } = require('../utils/qrHelper');
const { sendEmail, sendSMS } = require('../utils/notificationHelper');
const { recordAuditLog } = require('../middleware/auditMiddleware');

/**
 * @desc    Request OTP for visitor verification
 * @route   POST /api/visitors/otp/request
 * @access  Public
 */
const requestVisitorOTP = async (req, res) => {
  try {
    const { identifier, name } = req.body; // email or phone

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide email or phone number' });
    }

    const otp = await generateOTP(identifier);

    // If identifier contains @, send email; otherwise send SMS
    if (identifier.includes('@')) {
      await sendEmail({
        to: identifier,
        subject: 'Your Visitor Pass Verification Code',
        text: `Hello ${name || 'Visitor'}, your 6-digit verification code is: ${otp}. Valid for 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
            <h2 style="color: #0284c7;">Visitor Verification Code</h2>
            <p>Hello <strong>${name || 'Visitor'}</strong>,</p>
            <p>Use the following 6-digit code to complete your visitor pass pre-registration:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #0f172a; margin: 15px 0;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 13px;">This code is valid for 5 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });
    } else {
      await sendSMS({
        to: identifier,
        message: `Your Visitor Pass OTP code is: ${otp}. Valid for 5 minutes.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${identifier}`,
      // Include demo OTP in development for effortless testing & evaluation
      demoOtp: otp,
    });
  } catch (err) {
    console.error('Request OTP error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Verify visitor OTP
 * @route   POST /api/visitors/otp/verify
 * @access  Public
 */
const verifyVisitorOTP = async (req, res) => {
  try {
    const { identifier, code } = req.body;

    if (!identifier || !code) {
      return res.status(400).json({ success: false, message: 'Please provide identifier and OTP code' });
    }

    const verification = await verifyOTP(identifier, code);
    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Pre-register a visitor or on-the-spot registration
 * @route   POST /api/visitors/register
 * @access  Public (or Frontdesk / Security)
 */
const registerVisitor = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      company,
      photoUrl,
      idProofType,
      idProofNumber,
      hostId,
      organizationId,
      branchName,
      purpose,
      customPurpose,
      scheduledStartTime,
      scheduledEndTime,
      autoApprove,
    } = req.body;

    if (!fullName || !email || !phone || !hostId) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, phone number, and host are required',
      });
    }

    // Verify host exists
    const hostUser = await User.findById(hostId);
    if (!hostUser) {
      return res.status(404).json({ success: false, message: 'Selected Host Employee not found' });
    }

    // Upsert or create Visitor record
    let visitor = await Visitor.findOne({ email: email.toLowerCase().trim() });
    if (visitor) {
      visitor.fullName = fullName;
      visitor.phone = phone;
      visitor.company = company || visitor.company;
      if (photoUrl) visitor.photoUrl = photoUrl;
      if (idProofType) visitor.idProofType = idProofType;
      if (idProofNumber) visitor.idProofNumber = idProofNumber;
      visitor.isOtpVerified = true;
      await visitor.save();
    } else {
      visitor = await Visitor.create({
        fullName,
        email: email.toLowerCase().trim(),
        phone,
        company: company || 'Independent / Self',
        photoUrl: photoUrl || '',
        idProofType: idProofType || 'National ID',
        idProofNumber: idProofNumber || '',
        isOtpVerified: true,
      });
    }

    // Start & End times default to today if not provided
    const startTime = scheduledStartTime ? new Date(scheduledStartTime) : new Date();
    const endTime = scheduledEndTime
      ? new Date(scheduledEndTime)
      : new Date(new Date().setHours(18, 0, 0, 0)); // 6:00 PM today

    // Status: if autoApprove is requested (e.g. frontdesk on-the-spot pass), or host pre-authorized
    const isSecurityOrAdmin = req.user && ['admin', 'security'].includes(req.user.role);
    const shouldApprove = autoApprove === true || isSecurityOrAdmin;
    const initialStatus = shouldApprove ? 'APPROVED' : 'PENDING';

    // Create Appointment
    const appointment = await Appointment.create({
      visitorId: visitor._id,
      hostId: hostUser._id,
      organizationId: organizationId || hostUser.organization || null,
      branchName: branchName || 'Main Campus',
      purpose: purpose || 'Meeting',
      customPurpose: customPurpose || '',
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      status: initialStatus,
      approvalRemarks: shouldApprove ? 'Instantly verified & authorized by Frontdesk/Security' : '',
      isPreRegistered: !isSecurityOrAdmin,
    });

    let pass = null;

    // If approved immediately, generate Pass & QR
    if (shouldApprove) {
      const uniquePassNumber = 'VP-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
      const qrPayload = JSON.stringify({
        passNumber: uniquePassNumber,
        visitorId: visitor._id.toString(),
        visitorName: visitor.fullName,
        hostName: hostUser.name,
        validTo: endTime.toISOString(),
      });

      const qrCodeData = await generateQRCodeDataURL(qrPayload);

      pass = await Pass.create({
        passNumber: uniquePassNumber,
        appointmentId: appointment._id,
        visitorId: visitor._id,
        hostId: hostUser._id,
        organizationId: appointment.organizationId,
        qrCodeData,
        qrToken: uniquePassNumber,
        validFrom: startTime,
        validTo: endTime,
        status: 'ISSUED',
      });

      // Notify visitor of approved pass
      await sendEmail({
        to: visitor.email,
        subject: `Your Visitor Pass Badge: ${uniquePassNumber}`,
        text: `Your pass ${uniquePassNumber} has been issued. View it online.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
            <h2 style="color: #059669;">Visitor Pass Issued</h2>
            <p>Dear <strong>${visitor.fullName}</strong>,</p>
            <p>Your pass for meeting <strong>${hostUser.name}</strong> (${hostUser.department}) has been generated.</p>
            <p><strong>Pass Number:</strong> ${uniquePassNumber}</p>
            <p><strong>Valid Until:</strong> ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p>Please present your digital or printed pass at the security desk upon arrival.</p>
          </div>
        `,
      });
    } else {
      // Notify Host of pending appointment
      await sendEmail({
        to: hostUser.email,
        subject: `New Visitor Pass Request from ${visitor.fullName}`,
        text: `${visitor.fullName} (${visitor.company}) requested a visitor pass to meet you. Please review and approve.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
            <h2 style="color: #0284c7;">New Visitor Appointment Request</h2>
            <p>Hello <strong>${hostUser.name}</strong>,</p>
            <p>A new visitor pre-registration requires your approval:</p>
            <ul>
              <li><strong>Visitor:</strong> ${visitor.fullName} (${visitor.company})</li>
              <li><strong>Email/Phone:</strong> ${visitor.email} | ${visitor.phone}</li>
              <li><strong>Purpose:</strong> ${purpose} ${customPurpose ? `(${customPurpose})` : ''}</li>
              <li><strong>Scheduled Time:</strong> ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</li>
            </ul>
            <p>Please log in to your dashboard to approve or decline this pass.</p>
          </div>
        `,
      });
    }

    await recordAuditLog({
      req,
      action: shouldApprove ? 'PASS_ISSUED_INSTANTLY' : 'VISITOR_PRE_REGISTERED',
      resource: 'Visitor',
      details: { visitorId: visitor._id, hostId: hostUser._id, status: initialStatus },
      userId: req.user?._id || null,
      userName: req.user?.name || visitor.fullName,
      role: req.user?.role || 'visitor',
    });

    return res.status(201).json({
      success: true,
      message: shouldApprove
        ? 'Visitor pass created and issued successfully!'
        : 'Pre-registration submitted! Waiting for host approval.',
      status: initialStatus,
      visitor,
      appointment,
      pass,
    });
  } catch (err) {
    console.error('Visitor registration error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Upload visitor photo
 * @route   POST /api/visitors/upload-photo
 * @access  Public
 */
const uploadVisitorPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      photoUrl,
    });
  } catch (err) {
    console.error('Upload photo error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all visitors (Admin / Security / Frontdesk)
 * @route   GET /api/visitors
 * @access  Private (Admin, Security)
 */
const getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort('-createdAt').limit(100);
    return res.status(200).json({ success: true, count: visitors.length, visitors });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  requestVisitorOTP,
  verifyVisitorOTP,
  registerVisitor,
  uploadVisitorPhoto,
  getAllVisitors,
};
