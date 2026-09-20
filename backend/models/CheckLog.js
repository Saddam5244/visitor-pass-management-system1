const mongoose = require('mongoose');

const CheckLogSchema = new mongoose.Schema({
  passId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pass',
    required: true,
  },
  visitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true,
  },
  checkInTime: {
    type: Date,
    default: Date.now,
  },
  checkOutTime: {
    type: Date,
    default: null,
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  gate: {
    type: String,
    default: 'Main Entrance',
  },
  status: {
    type: String,
    enum: ['IN', 'OUT'],
    default: 'IN',
  },
  belongingsDeclared: {
    type: String,
    default: 'Laptop / Mobile',
  },
  durationMinutes: {
    type: Number,
    default: 0,
  },
  overstayAlertSent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CheckLog', CheckLogSchema);
