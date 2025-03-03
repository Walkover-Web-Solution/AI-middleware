import mongoose from "mongoose";

const ragDataSchema = new mongoose.Schema({
  org_id: {
    type: String,
    required: true
  },
  doc_id: {
    type: String,
    required: true
  },
  user_id:{
    type :String,
  },
  data: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Object, 
  }
});

ragDataSchema.index({ org_id: 1 });

const ragDataModel = mongoose.model("rag_datas", ragDataSchema);

export default ragDataModel;
