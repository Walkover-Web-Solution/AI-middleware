import mongoose from "mongoose";

const { Schema } = mongoose;

const WebhookConfigurationSchema = new Schema(
  {
    url: {
      type: String,
    },
    headers: {
      type: Map,
      of: String,
    },
  },
  { _id: false }
);

const AlertSchema = new Schema({
  org_id: {
    type: String,
  },
  name: {
    type: String,
  },
  webhookConfiguration: {
    type: WebhookConfigurationSchema,
  },
  alertType: {
    type: [String],
  },
  bridges: {
    type: [String],
  },
  limit: {
    type: Number,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
});

const alerts_Model = mongoose.model("alerts", AlertSchema);

export { alerts_Model };
