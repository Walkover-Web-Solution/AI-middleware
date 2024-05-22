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
  activated: {
    type: Boolean,
    default: false
  },
  required_fields: {
    type: [String],
    default: []
  },
  short_description: {
    type: String,
    // required: true,
    default: ''
  },
  axios: {
    type: String,
    // required: true,
    default: ''
  },
  optional_fields: {
    type: [String],
    default: []
  },
  endpoint: {
    // COMPLETE IT
    type: String,
    default: ""
  },
  api_description: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});
const apiCallModel = mongoose.model("apicall", apiCall);
export default apiCallModel;

