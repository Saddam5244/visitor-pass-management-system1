const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

/**
 * Persist notification directly in MongoDB
 */
const logNotification = async (type, recipient, subject, message) => {
  try {
    const item = await Notification.create({
      type, // 'EMAIL' or 'SMS'
      recipient,
      subject,
      message,
      status: 'DELIVERED',
      createdAt: new Date(),
    });
    return item;
  } catch (err) {
    console.error('[Notification Store Error]:', err.message);
    return null;
  }
};

/**
 * Send an Email notification and store in MongoDB
 */
const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`[Notification: EMAIL] To: ${to} | Subject: "${subject}"`);
  await logNotification('EMAIL', to, subject, text || subject);

  // If real SMTP is configured and not default mock
  if (process.env.SMTP_HOST && process.env.SMTP_USER !== 'mock@visitorpass.com') {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Visitor Pass System" <no-reply@visitorpass.com>',
        to,
        subject,
        text,
        html,
      });
      console.log(`[Notification: EMAIL] Sent successfully to ${to}`);
    } catch (err) {
      console.warn(`[Notification: EMAIL] SMTP warning: ${err.message}. Stored in database.`);
    }
  }

  return true;
};

/**
 * Send an SMS notification and store in MongoDB
 */
const sendSMS = async ({ to, message }) => {
  console.log(`[Notification: SMS] To: ${to} | Body: "${message}"`);
  await logNotification('SMS', to, 'SMS Security Alert', message);
  return true;
};

/**
 * Get recent system notifications from MongoDB
 */
const getRecentNotifications = async (limit = 100) => {
  try {
    return await Notification.find().sort('-createdAt').limit(limit);
  } catch (err) {
    console.error('Error fetching notifications from DB:', err.message);
    return [];
  }
};

module.exports = {
  sendEmail,
  sendSMS,
  getRecentNotifications,
};
