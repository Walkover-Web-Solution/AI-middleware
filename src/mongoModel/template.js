import mongoose from "mongoose";

const template = new mongoose.Schema({
  template: {
    type: String,
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

const templateModel = mongoose.model("template", template);

export default templateModel