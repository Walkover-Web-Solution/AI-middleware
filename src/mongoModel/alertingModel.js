import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  org_id: {
    type: String,
    required: true,
  },
  name: {
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
    enum: ['Error', 'Variable'],
    default: [],
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

alertSchema.index({ org_id: 1, name: 1 }, { unique: true });

alertSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.bridges || this.bridges.length === 0) {
    this.bridges = ['all'];
  }
  next();
});

const AlertModel = mongoose.model('Alert', alertSchema);

export default AlertModel;