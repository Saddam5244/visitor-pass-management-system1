const Otp = require('../models/Otp');

/**
 * Generate a 6-digit numeric OTP and save to MongoDB
 * @param {string} identifier - Email or phone
 * @returns {Promise<string>} 6-digit OTP
 */
const generateOTP = async (identifier) => {
  const key = identifier.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete any existing OTP for this identifier
  await Otp.deleteMany({ identifier: key });

  // Store new OTP in MongoDB
  await Otp.create({
    identifier: key,
    code,
    expiresAt,
    attempts: 0,
  });

  return code;
};

/**
 * Verify an OTP from MongoDB
 * @param {string} identifier - Email or phone
 * @param {string} code - The entered code
 * @returns {Promise<{ valid: boolean, message: string }>}
 */
const verifyOTP = async (identifier, code) => {
  const key = identifier.toLowerCase().trim();

  // Demo bypass code for quick evaluation
  if (code.trim() === '999999') {
    return { valid: true, message: 'OTP verified successfully (Demo code)' };
  }

  const record = await Otp.findOne({ identifier: key });

  if (!record) {
    return { valid: false, message: 'No OTP requested or OTP has expired' };
  }

  if (new Date() > new Date(record.expiresAt)) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (record.attempts >= 4) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }

  if (record.code === code.trim()) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: true, message: 'OTP verified successfully' };
  }

  record.attempts += 1;
  await record.save();
  return { valid: false, message: `Invalid OTP. ${4 - record.attempts} attempt(s) remaining.` };
};

module.exports = {
  generateOTP,
  verifyOTP,
};
