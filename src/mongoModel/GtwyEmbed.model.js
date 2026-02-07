import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  org_id: {
    type: String,
    required: true
  },
  type: {
    type: String
  },
  config: {
    type: Object,
    default: {}
  },
  apikey_object_id: {
    type: Object,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  folder_limit: {
    type: Number,
    default: 0
  },
  folder_usage: {
    type: Number,
    default: 0
  }
});

const FolderModel = mongoose.model("Folder", FolderSchema);

export default FolderModel;
