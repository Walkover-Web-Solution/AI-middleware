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
  type: {
    type: Number,
    default: 1
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
  slugName: {
    type: String,
    required: true
  },
  actions : {
    type: Map,
    of :  actionTypeModel
  }
}, {
  timestamps: true // This option automatically manages createdAt and updatedAt
});

configuration.index({ org_id: 1, slugName: 1 }, { unique: true });
const configurationModel = mongoose.model("configuration", configuration);
export default configurationModel;