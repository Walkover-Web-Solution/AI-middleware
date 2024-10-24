import mongoose from "mongoose";
const Schema = mongoose.Schema;

const actionTypeModel = new Schema({
  description: {
    type: String
  },
  type :{
    type : String
  },
  variable : {
    type : String 
  }
}, {
  _id: false
});
const configuration = new mongoose.Schema({
  org_id: {
    type: String,
    required: true
  },
  service: {
    type: String,
    default: ""
  },
  bridgeType: {
    type: String,
    enum: ['api', 'chatbot'],
    required: true,
    default: 'chatbot'
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
  },
  slugName: {
    type: String,
    required: true
  },
  status:{
    type: Number,
    default: 1,
    required: true
  },
  responseIds: {
    type: Array,
    default: []
  },
  responseRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResponseType'
  },
  defaultQuestions: {
    type: Array
  },
  actions : {
    type: Map,
    of :  actionTypeModel
  }
});

configuration.index({ org_id: 1, slugName: 1 }, { unique: true });
const configurationModel = mongoose.model("configuration", configuration);
export default configurationModel;