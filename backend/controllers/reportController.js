const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get Key Performance Indicator (KPI) metrics
 * @route   GET /api/reports/stats
 * @access  Private (Admin, Security, Employee)
 */
const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalVisitorsAllTime,
      todayAppointments,
      todayPassesIssued,
      currentlyInsideCount,
      activeCheckLogs,
    ] = await Promise.all([
      Visitor.countDocuments(),
      Appointment.countDocuments({ scheduledStartTime: { $gte: todayStart, $lte: todayEnd } }),
      Pass.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      CheckLog.countDocuments({ status: 'IN' }),
      CheckLog.find({ status: 'IN' }).populate('passId', 'validTo'),
    ]);

    // Overstay count
    const now = new Date();
    const overstayCount = activeCheckLogs.filter((log) => {
      return log.passId?.validTo && now > new Date(log.passId.validTo);
    }).length;

    // Total check-ins today
    const todayCheckIns = await CheckLog.countDocuments({
      checkInTime: { $gte: todayStart, $lte: todayEnd },
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalVisitorsAllTime,
        todayAppointments,
        todayPassesIssued,
        currentlyInsideCount,
        todayCheckIns,
        overstayCount,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get Analytics & Trends (Peak hours, Category breakdown, 7-day trend)
 * @route   GET /api/reports/analytics
 * @access  Private (Admin, Security)
 */
const getAnalyticsData = async (req, res) => {
  try {
    // 1. Peak check-in hours breakdown (8:00 AM - 6:00 PM)
    const allLogs = await CheckLog.find().select('checkInTime');
    const hourlyCounts = {
      '08:00 AM': 0,
      '09:00 AM': 0,
      '10:00 AM': 0,
      '11:00 AM': 0,
      '12:00 PM': 0,
      '01:00 PM': 0,
      '02:00 PM': 0,
      '03:00 PM': 0,
      '04:00 PM': 0,
      '05:00 PM': 0,
      '06:00 PM': 0,
    };

    allLogs.forEach((log) => {
      if (log.checkInTime) {
        const hour = new Date(log.checkInTime).getHours();
        if (hour >= 8 && hour <= 18) {
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const formattedHour = (hour % 12 || 12).toString().padStart(2, '0');
          const key = `${formattedHour}:00 ${ampm}`;
          if (hourlyCounts[key] !== undefined) {
            hourlyCounts[key] += 1;
          }
        }
      }
    });

    const peakHoursData = Object.entries(hourlyCounts).map(([hour, count]) => ({
      hour,
      visitors: count,
    }));

    // 2. Purpose / Category distribution
    const appointments = await Appointment.find().select('purpose');
    const purposeCounts = {};
    appointments.forEach((a) => {
      const p = a.purpose || 'Other';
      purposeCounts[p] = (purposeCounts[p] || 0) + 1;
    });

    const purposeData = Object.entries(purposeCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // 3. Past 7 days trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));

      const count = await CheckLog.countDocuments({
        checkInTime: { $gte: dayStart, $lte: dayEnd },
      });

      last7Days.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        checkIns: count,
      });
    }

    return res.status(200).json({
      success: true,
      peakHours: peakHoursData,
      purposeBreakdown: purposeData,
      weeklyTrend: last7Days,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Export Visitor Logs as CSV
 * @route   GET /api/reports/export/csv
 * @access  Private (Admin, Security)
 */
const exportReportCSV = async (req, res) => {
  try {
    const logs = await CheckLog.find()
      .populate('visitorId', 'fullName email phone company')
      .populate('passId', 'passNumber')
      .populate('checkedInBy', 'name')
      .populate('checkedOutBy', 'name')
      .sort('-checkInTime');

    const headers = [
      'Pass Number',
      'Visitor Name',
      'Email',
      'Phone',
      'Company',
      'Gate',
      'Check-In Time',
      'Check-Out Time',
      'Duration (Minutes)',
      'Status',
      'Checked In By',
      'Checked Out By',
    ];

    const rows = logs.map((log) => [
      `"${log.passId?.passNumber || 'N/A'}"`,
      `"${log.visitorId?.fullName || 'N/A'}"`,
      `"${log.visitorId?.email || 'N/A'}"`,
      `"${log.visitorId?.phone || 'N/A'}"`,
      `"${log.visitorId?.company || 'N/A'}"`,
      `"${log.gate || 'Main Entrance'}"`,
      `"${log.checkInTime ? new Date(log.checkInTime).toLocaleString() : 'N/A'}"`,
      `"${log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : 'Currently Inside'}"`,
      `"${log.durationMinutes || 0}"`,
      `"${log.status}"`,
      `"${log.checkedInBy?.name || 'Security Officer'}"`,
      `"${log.checkedOutBy?.name || 'N/A'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Visitor_Report_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('CSV export error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get Audit Logs (Admin only)
 * @route   GET /api/reports/audit-logs
 * @access  Private (Admin)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { action, limit } = req.query;
    let query = {};
    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .sort('-timestamp')
      .limit(parseInt(limit) || 100);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err) {
    console.error('Audit logs error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getAnalyticsData,
  exportReportCSV,
  getAuditLogs,
};
