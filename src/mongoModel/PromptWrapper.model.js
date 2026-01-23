import mongoose from "mongoose";

const promptWrapperSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  template: {
    type: String,
    required: true,
  },
  variables: {
    type: [String],
    default: [],
  },
  org_id: {
    type: String,
    required: true,
  },
  created_by: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const PromptWrapperModel = mongoose.model("prompt_wrappers", promptWrapperSchema);

export default PromptWrapperModel;
