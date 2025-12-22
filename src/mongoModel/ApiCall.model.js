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
  function_name: {
    type: String,
    required: true,
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
  fields: {
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
  created_at: {
    type: Date,
    default: Date.now
  }
});
const apiCallModel = mongoose.model("apicall", apiCall);
export default apiCallModel;
