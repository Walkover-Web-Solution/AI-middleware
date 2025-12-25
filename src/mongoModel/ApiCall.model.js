import mongoose from "mongoose";
const apiCall = new mongoose.Schema({
  org_id: {
    type: String,
    default: ""
  },
  bridge_id: {
    type: String,
    default: ""
  },
  bridge_ids: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  activated: {
    type: Boolean,
    default: false
  },
  required_fields: {
    type: [String],
    default: []
  },
  function_name: {
    type: String,
    required: true,
  },
  axios: {
    type: String,
    default: ''
  },
  optional_fields: {
    type: [String],
    default: []
  },
  endpoint: {
    type: String,
    default: ""
  },
  api_description: {
    type: String
  },
  // v2 format: fields is an object where each key is a parameter name
  // and value is { description, type, enum, required_params, parameter }
  fields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Backup of original fields before migration
  old_fields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  required_params: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ""
  },
  title: {
    type: String,
    default: ""
  },
  status: {
    type: Number,
    default: 1
  },
  version: {
    type: String,
    default: "v2"
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
const apiCallModel = mongoose.model("apicall", apiCall);
export default apiCallModel;
