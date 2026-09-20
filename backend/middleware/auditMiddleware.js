const AuditLog = require('../models/AuditLog');

/**
 * Record an audit log entry
 */
const recordAuditLog = async ({ req, action, resource, details = {}, userId = null, userName = null, role = null }) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    
    await AuditLog.create({
      userId: userId || req.user?._id || null,
      userName: userName || req.user?.name || 'Public Visitor',
      role: role || req.user?.role || 'visitor',
      action,
      resource,
      details,
      ipAddress: typeof ip === 'string' ? ip.replace('::ffff:', '') : '127.0.0.1',
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = {
  recordAuditLog,
};
