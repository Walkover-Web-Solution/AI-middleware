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
    type : mongoose.Schema.Types.Mixed,
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
        fileFormat: {
          type: String, 
          enum: ['csv', 'txt', 'pdf', 'docx', 'xlsx', 'pptx'], 
          required: true
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
    enum: ["semantic", "manual", "recursive", "ai", "auto"],
    required: true,
  },
  is_chunking_type_auto: {
    type: Boolean, 
    default: false
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

ragParentDataSchema.index({ org_id: 1 });

const ragParentDataModel = mongoose.model("rag_parent_datas", ragParentDataSchema);

export default ragParentDataModel;
