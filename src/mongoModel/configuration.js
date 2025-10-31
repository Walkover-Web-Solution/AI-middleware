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

const pageConfigSchema = new Schema({
    url_slugname: {
        type: String,
        unique: true,
        sparse: true // this makes sure that if the url_slugname is not present in the document
        // mongo will still create an index on the field, and will not throw an error if the field is not present in the document.
        // This is useful when we are using the same schema for multiple collections, and not all collections have this field.
    },
    availability: {
        type: String,
        enum: ['public', 'private'],
        default: 'private'
    },
    allowedUsers: {
        type: [String],
        default: []
    }
}, { _id: false });


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
  },
  hello_id :{
    type: String
  },
  IsstarterQuestionEnable:{
    type: Boolean
  },
  page_config : {
    type : pageConfigSchema,
    default : null,
  },
  apikey_object_id: {
    type: Object
  },
  meta: {
    type: Object,
    default: {}
  },
  bridge_limit: {
    type: Number,
    default: 0
  },
  bridge_usage: {
    type: Number,
    default: 0
  }
});

configuration.index({ org_id: 1, slugName: 1 }, { unique: true });
const configurationModel = mongoose.model("configuration", configuration);
export default configurationModel;
