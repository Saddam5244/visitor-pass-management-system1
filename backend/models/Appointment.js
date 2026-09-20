const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
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
  branchName: {
    type: String,
    default: 'Main Campus',
  },
  purpose: {
    type: String,
    enum: ['Meeting', 'Interview', 'Vendor / Contractor', 'Maintenance', 'Delivery', 'Client Demo', 'Personal', 'Other'],
    default: 'Meeting',
  },
  customPurpose: {
    type: String,
    default: '',
  },
  scheduledStartTime: {
    type: Date,
    required: true,
  },
  scheduledEndTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
    default: 'PENDING',
  },
  approvalRemarks: {
    type: String,
    default: '',
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isPreRegistered: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
