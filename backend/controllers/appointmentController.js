const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const { generateQRCodeDataURL } = require('../utils/qrHelper');
const { sendEmail } = require('../utils/notificationHelper');
const { recordAuditLog } = require('../middleware/auditMiddleware');

/**
 * @desc    Get appointments list based on role
 * @route   GET /api/appointments
 * @access  Private (Employee, Security, Admin)
 */
const getAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = {};

    // Role scoping: Employee only sees appointments where they are the host
    if (req.user.role === 'employee') {
      query.hostId = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.scheduledStartTime = { $gte: dayStart, $lte: dayEnd };
    }

    const appointments = await Appointment.find(query)
      .populate('visitorId', 'fullName email phone company photoUrl idProofType idProofNumber')
      .populate('hostId', 'name email department phone organizationName')
      .populate('organizationId', 'name code')
      .sort('-scheduledStartTime');

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (err) {
    console.error('Get appointments error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Host invites a visitor
 * @route   POST /api/appointments/invite
 * @access  Private (Employee, Admin)
 */
const inviteVisitor = async (req, res) => {
  try {
    const { visitorName, visitorEmail, visitorPhone, company, purpose, scheduledStartTime, scheduledEndTime } =
      req.body;

    if (!visitorName || !visitorEmail || !scheduledStartTime) {
      return res.status(400).json({
        success: false,
        message: 'Visitor name, email, and scheduled start time are required',
      });
    }

    // Upsert visitor
    let visitor = await Visitor.findOne({ email: visitorEmail.toLowerCase().trim() });
    if (!visitor) {
      visitor = await Visitor.create({
        fullName: visitorName,
        email: visitorEmail.toLowerCase().trim(),
        phone: visitorPhone || '',
        company: company || 'Invited Guest',
        isOtpVerified: true,
      });
    }

    const startTime = new Date(scheduledStartTime);
    const endTime = scheduledEndTime ? new Date(scheduledEndTime) : new Date(new Date(startTime).getTime() + 4 * 3600 * 1000);

    // Create Pre-approved Appointment
    const appointment = await Appointment.create({
      visitorId: visitor._id,
      hostId: req.user._id,
      organizationId: req.user.organization || null,
      purpose: purpose || 'Meeting',
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      status: 'APPROVED',
      approvalRemarks: `Directly invited and authorized by ${req.user.name}`,
      invitedBy: req.user._id,
      isPreRegistered: true,
    });

    // Generate Pass
    const uniquePassNumber = 'VP-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const qrPayload = JSON.stringify({
      passNumber: uniquePassNumber,
      visitorId: visitor._id.toString(),
      visitorName: visitor.fullName,
      hostName: req.user.name,
      validTo: endTime.toISOString(),
    });

    const qrCodeData = await generateQRCodeDataURL(qrPayload);

    const pass = await Pass.create({
      passNumber: uniquePassNumber,
      appointmentId: appointment._id,
      visitorId: visitor._id,
      hostId: req.user._id,
      organizationId: req.user.organization || null,
      qrCodeData,
      qrToken: uniquePassNumber,
      validFrom: startTime,
      validTo: endTime,
      status: 'ISSUED',
    });

    // Notify invited visitor
    await sendEmail({
      to: visitor.email,
      subject: `Invitation from ${req.user.name}: Your Visitor Pass Badge`,
      text: `You have been invited by ${req.user.name}. Your pass ${uniquePassNumber} is ready.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
          <h2 style="color: #0284c7;">You're Invited!</h2>
          <p>Hello <strong>${visitor.fullName}</strong>,</p>
          <p><strong>${req.user.name}</strong> (${req.user.department}) has invited you for a visit.</p>
          <div style="background: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 15px 0;">
            <p><strong>Pass Number:</strong> ${uniquePassNumber}</p>
            <p><strong>Date:</strong> ${startTime.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <p>Please present this digital pass badge upon arrival at the security gate.</p>
        </div>
      `,
    });

    await recordAuditLog({
      req,
      action: 'VISITOR_INVITED',
      resource: 'Appointment',
      details: { visitorId: visitor._id, passNumber: uniquePassNumber },
    });

    return res.status(201).json({
      success: true,
      message: 'Invitation sent and visitor pass generated successfully!',
      appointment,
      pass,
    });
  } catch (err) {
    console.error('Invite visitor error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Host or Admin approves appointment & generates pass
 * @route   PUT /api/appointments/:id/approve
 * @access  Private (Employee, Admin, Security)
 */
const approveAppointment = async (req, res) => {
  try {
    const { remarks } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('visitorId')
      .populate('hostId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Role authorization: Employee can only approve their own appointments
    if (req.user.role === 'employee' && appointment.hostId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve this visitor' });
    }

    appointment.status = 'APPROVED';
    appointment.approvalRemarks = remarks || 'Approved by host';
    await appointment.save();

    // Check if pass already created
    let pass = await Pass.findOne({ appointmentId: appointment._id });
    if (!pass) {
      const uniquePassNumber = 'VP-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
      const qrPayload = JSON.stringify({
        passNumber: uniquePassNumber,
        visitorId: appointment.visitorId._id.toString(),
        visitorName: appointment.visitorId.fullName,
        hostName: appointment.hostId.name,
        validTo: appointment.scheduledEndTime.toISOString(),
      });

      const qrCodeData = await generateQRCodeDataURL(qrPayload);

      pass = await Pass.create({
        passNumber: uniquePassNumber,
        appointmentId: appointment._id,
        visitorId: appointment.visitorId._id,
        hostId: appointment.hostId._id,
        organizationId: appointment.organizationId,
        qrCodeData,
        qrToken: uniquePassNumber,
        validFrom: appointment.scheduledStartTime,
        validTo: appointment.scheduledEndTime,
        status: 'ISSUED',
      });
    }

    // Send confirmation email to visitor
    await sendEmail({
      to: appointment.visitorId.email,
      subject: `Visitor Pass Approved: ${pass.passNumber}`,
      text: `Your visitor pass request has been approved by ${appointment.hostId.name}. Pass: ${pass.passNumber}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
          <h2 style="color: #059669;">Your Visitor Pass is Approved!</h2>
          <p>Hello <strong>${appointment.visitorId.fullName}</strong>,</p>
          <p>Your request to visit <strong>${appointment.hostId.name}</strong> has been approved.</p>
          <div style="background: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 15px 0;">
            <p><strong>Pass Number:</strong> ${pass.passNumber}</p>
            <p><strong>Valid Until:</strong> ${new Date(pass.validTo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <p>Please present this digital pass at the front desk/security upon your arrival.</p>
        </div>
      `,
    });

    await recordAuditLog({
      req,
      action: 'APPOINTMENT_APPROVED',
      resource: 'Appointment',
      details: { appointmentId: appointment._id, passNumber: pass.passNumber },
    });

    return res.status(200).json({
      success: true,
      message: 'Appointment approved and pass issued!',
      appointment,
      pass,
    });
  } catch (err) {
    console.error('Approve appointment error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Host or Admin rejects appointment
 * @route   PUT /api/appointments/:id/reject
 * @access  Private (Employee, Admin, Security)
 */
const rejectAppointment = async (req, res) => {
  try {
    const { remarks } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('visitorId')
      .populate('hostId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (req.user.role === 'employee' && appointment.hostId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this appointment' });
    }

    appointment.status = 'REJECTED';
    appointment.approvalRemarks = remarks || 'Host unavailable or schedule conflict';
    await appointment.save();

    // Notify visitor
    await sendEmail({
      to: appointment.visitorId.email,
      subject: `Visitor Pass Request Update`,
      text: `Your visitor pass request was declined: ${appointment.approvalRemarks}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #fef2f2; border-radius: 8px;">
          <h2 style="color: #dc2626;">Visitor Request Update</h2>
          <p>Hello <strong>${appointment.visitorId.fullName}</strong>,</p>
          <p>Your visitor request for meeting <strong>${appointment.hostId.name}</strong> was declined.</p>
          <p><strong>Reason:</strong> ${appointment.approvalRemarks}</p>
        </div>
      `,
    });

    await recordAuditLog({
      req,
      action: 'APPOINTMENT_REJECTED',
      resource: 'Appointment',
      details: { appointmentId: appointment._id, reason: remarks },
    });

    return res.status(200).json({
      success: true,
      message: 'Appointment request rejected',
      appointment,
    });
  } catch (err) {
    console.error('Reject appointment error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAppointments,
  inviteVisitor,
  approveAppointment,
  rejectAppointment,
};
