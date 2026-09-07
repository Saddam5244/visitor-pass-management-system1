const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const { recordAuditLog } = require('../middleware/auditMiddleware');
const { sendEmail, sendSMS } = require('../utils/notificationHelper');

/**
 * @desc    Security Scans QR / Enters Pass Number to Check-In
 * @route   POST /api/checklogs/check-in
 * @access  Private (Security, Admin)
 */
const scanCheckIn = async (req, res) => {
  try {
    const { passNumber, gate, belongingsDeclared } = req.body;

    if (!passNumber) {
      return res.status(400).json({ success: false, message: 'Pass Number or QR token is required' });
    }

    // Lookup pass
    const pass = await Pass.findOne({
      $or: [{ passNumber: passNumber.toUpperCase().trim() }, { qrToken: passNumber.trim() }],
    })
      .populate('visitorId')
      .populate('hostId');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Invalid pass or pass not found' });
    }

    if (pass.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'This pass has been cancelled' });
    }

    // Check if already checked in
    const existingActiveLog = await CheckLog.findOne({
      passId: pass._id,
      status: 'IN',
    });

    if (existingActiveLog) {
      return res.status(400).json({
        success: false,
        message: `Visitor is already checked in since ${new Date(existingActiveLog.checkInTime).toLocaleTimeString()}`,
        activeCheckLog: existingActiveLog,
      });
    }

    // Create CheckLog
    const checkLog = await CheckLog.create({
      passId: pass._id,
      visitorId: pass.visitorId._id,
      checkInTime: new Date(),
      checkedInBy: req.user._id,
      gate: gate || 'Main Entrance',
      belongingsDeclared: belongingsDeclared || 'None / Standard',
      status: 'IN',
    });

    // Update Pass status
    pass.status = 'CHECKED_IN';
    await pass.save();

    // Notify Host that visitor has arrived
    if (pass.hostId?.email) {
      await sendEmail({
        to: pass.hostId.email,
        subject: `Visitor Arrived: ${pass.visitorId.fullName}`,
        text: `Your visitor ${pass.visitorId.fullName} (${pass.visitorId.company}) has checked in at ${gate || 'Main Entrance'}.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #ecfdf5; border-radius: 8px;">
            <h2 style="color: #059669;">Visitor Checked In!</h2>
            <p>Hello <strong>${pass.hostId.name}</strong>,</p>
            <p>Your visitor <strong>${pass.visitorId.fullName}</strong> (${pass.visitorId.company}) has just checked in.</p>
            <p><strong>Gate:</strong> ${gate || 'Main Entrance'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
        `,
      });
    }

    await recordAuditLog({
      req,
      action: 'VISITOR_CHECK_IN',
      resource: 'CheckLog',
      details: {
        passNumber: pass.passNumber,
        visitorName: pass.visitorId.fullName,
        gate: gate || 'Main Entrance',
      },
    });

    return res.status(200).json({
      success: true,
      message: `Checked in ${pass.visitorId.fullName} successfully!`,
      checkLog,
      pass,
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Security Scans QR / Enters Pass Number to Check-Out
 * @route   POST /api/checklogs/check-out
 * @access  Private (Security, Admin)
 */
const scanCheckOut = async (req, res) => {
  try {
    const { passNumber, gate } = req.body;

    if (!passNumber) {
      return res.status(400).json({ success: false, message: 'Pass Number or QR token is required' });
    }

    const pass = await Pass.findOne({
      $or: [{ passNumber: passNumber.toUpperCase().trim() }, { qrToken: passNumber.trim() }],
    })
      .populate('visitorId')
      .populate('hostId');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    // Find active CheckLog
    const checkLog = await CheckLog.findOne({
      passId: pass._id,
      status: 'IN',
    });

    if (!checkLog) {
      return res.status(400).json({
        success: false,
        message: 'No active check-in found for this pass. Visitor is not currently inside.',
      });
    }

    const checkOutTime = new Date();
    const durationMinutes = Math.round((checkOutTime.getTime() - new Date(checkLog.checkInTime).getTime()) / 60000);

    checkLog.checkOutTime = checkOutTime;
    checkLog.checkedOutBy = req.user._id;
    checkLog.durationMinutes = durationMinutes;
    checkLog.status = 'OUT';
    await checkLog.save();

    pass.status = 'CHECKED_OUT';
    await pass.save();

    // Notify Host of departure
    if (pass.hostId?.email) {
      await sendEmail({
        to: pass.hostId.email,
        subject: `Visitor Departed: ${pass.visitorId.fullName}`,
        text: `Your visitor ${pass.visitorId.fullName} checked out. Stay duration: ${durationMinutes} minutes.`,
      });
    }

    await recordAuditLog({
      req,
      action: 'VISITOR_CHECK_OUT',
      resource: 'CheckLog',
      details: {
        passNumber: pass.passNumber,
        visitorName: pass.visitorId.fullName,
        durationMinutes,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Checked out ${pass.visitorId.fullName} successfully. Duration: ${durationMinutes} mins.`,
      durationMinutes,
      checkLog,
      pass,
    });
  } catch (err) {
    console.error('Check-out error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get currently inside visitors roster (with overstay calculation)
 * @route   GET /api/checklogs/inside
 * @access  Private (Security, Admin, Employee)
 */
const getCurrentlyInside = async (req, res) => {
  try {
    const activeLogs = await CheckLog.find({ status: 'IN' })
      .populate('visitorId', 'fullName email phone company photoUrl')
      .populate('passId', 'passNumber validTo badgeType allowedGates')
      .populate('checkedInBy', 'name')
      .sort('-checkInTime');

    const now = new Date();
    const formattedList = activeLogs.map((log) => {
      const validTo = log.passId?.validTo ? new Date(log.passId.validTo) : null;
      const isOverstay = validTo && now > validTo;
      const overstayMinutes = isOverstay ? Math.round((now.getTime() - validTo.getTime()) / 60000) : 0;
      const stayDurationMinutes = Math.round((now.getTime() - new Date(log.checkInTime).getTime()) / 60000);

      return {
        ...log.toObject(),
        isOverstay,
        overstayMinutes,
        currentDurationMinutes: stayDurationMinutes,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedList.length,
      overstayCount: formattedList.filter((item) => item.isOverstay).length,
      visitors: formattedList,
    });
  } catch (err) {
    console.error('Get inside visitors error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all check logs with filters
 * @route   GET /api/checklogs
 * @access  Private (Security, Admin)
 */
const getCheckLogs = async (req, res) => {
  try {
    const { status, gate, date } = req.query;
    let query = {};

    if (status) query.status = status;
    if (gate) query.gate = gate;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.checkInTime = { $gte: start, $lte: end };
    }

    const logs = await CheckLog.find(query)
      .populate('visitorId', 'fullName email phone company photoUrl')
      .populate('passId', 'passNumber validFrom validTo')
      .populate('checkedInBy', 'name')
      .populate('checkedOutBy', 'name')
      .sort('-checkInTime')
      .limit(200);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err) {
    console.error('Get check logs error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  scanCheckIn,
  scanCheckOut,
  getCurrentlyInside,
  getCheckLogs,
};
