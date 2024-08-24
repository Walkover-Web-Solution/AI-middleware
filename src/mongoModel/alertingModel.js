const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  orgId: {
    type: String,
    required: true,
  },
  alertName: {
    type: String,
    required: true,
    trim: true,
  },
  webhookConfiguration: {
    url: {
      type: String,
      required: true,
    },
    headers: {
      type: Map,
      of: String,
    },
  },
  alertType: {
    type: [String],
    enum: ['API Key Expiry', 'Error Occurrence', 'Performance Degradation'],
    default: ['API Key Expiry', 'Error Occurrence', 'Performance Degradation'],
    required: true,
  },
  bridges: {
    type: [String],
    default: ['all'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the 'updatedAt' field on save
alertSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;