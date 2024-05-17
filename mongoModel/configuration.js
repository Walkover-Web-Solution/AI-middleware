import mongoose from "mongoose";
const configuration = new mongoose.Schema({
  org_id: {
    type: String,
    default: ""
  },
  service: {
    type: String,
    default: ""
  },
  name: {
    type: String,
    default: ""
  },
  configuration: {
    type: Object,
    default: {}
  },
  apikey: {
    type: String,
    default: ""
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  api_call: {
    type: Object,
    default: {}
  },
  api_endpoints: {
    type: Object,
    default: []
  },
  is_api_call: {
    type: Boolean,
    default: false
  }
});
const configurationModel = mongoose.model("configuration", configuration);
export  {
  configurationModel
};