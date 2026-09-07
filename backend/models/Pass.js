const mongoose = require('mongoose');

const PassSchema = new mongoose.Schema({
  passNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  visitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  qrCodeData: {
    type: String, // Base64 data URL for quick display
    required: true,
  },
  qrToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  badgeType: {
    type: String,
    enum: ['VISITOR', 'VIP', 'CONTRACTOR', 'INTERVIEWEE', 'TEMPORARY'],
    default: 'VISITOR',
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validTo: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['ISSUED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'CANCELLED'],
    default: 'ISSUED',
  },
  allowedGates: {
    type: [String],
    default: ['Main Entrance', 'Reception Gate'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Pass', PassSchema);
