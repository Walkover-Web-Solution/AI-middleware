import mongoose from "mongoose";

const ragParentDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  org_id: {
    type: String,
    required: true,
  },
  content :{
    type :String,

  },  
  user_id: {
    type: String,
    required: false,
  },
  source: {
    type: new mongoose.Schema(
      {
        url  :{
          type :String 
        },
        type: {
          type: String,
          enum: ["file", "url"],
          required: true,
        },
        data: {
          type: Object,
          required: true,
        },
      },
      { _id: false } // Prevents automatic _id generation for subdocument
    ),
    required: true,
  },
  chunking_type: {
    type: String,
    enum: ["semantic", "manual", "recursive"],
    required: true,
  },
  chunk_size: {
    type: Number,
    required: true,
  },
  chunk_overlap: {
    type: Number,
    required: true,
  },
});

const ragParentDataModel = mongoose.model("rag_parent_datas", ragParentDataSchema);

export default ragParentDataModel;
