import mongoose from "mongoose";
const apiCall = new mongoose.Schema({
  org_id: {
    type: String,
    default: "",
  },
  bridge_id: {
    type: String,
    default: "",
  },
  bridge_ids: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },
  activated: {
    type: Boolean,
    default: false,
  },
  script_id: {
    type: String,
    required: true,
  },
  fields: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Backup of original fields before migration
  old_fields: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  required_params: {
    type: [String],
    default: [],
  },
  description: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "",
  },
  status: {
    type: Number,
    default: 1,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  folder_id: {
    type: String,
    default: "",
  },
  user_id: {
    type: String,
    default: "",
  },
});
const apiCallModel = mongoose.model("apicall", apiCall);
export default apiCallModel;
