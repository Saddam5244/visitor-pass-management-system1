const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  company: {
    type: String,
    default: 'Independent / Self',
    trim: true,
  },
  photoUrl: {
    type: String,
    default: '',
  },
  idProofType: {
    type: String,
    enum: ['Passport', 'National ID', 'Driving License', 'Aadhaar', 'Employee Badge', 'Other'],
    default: 'National ID',
  },
  idProofNumber: {
    type: String,
    default: '',
    trim: true,
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  isOtpVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Visitor', VisitorSchema);
