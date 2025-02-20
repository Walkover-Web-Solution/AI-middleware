import mongoose from "mongoose";

const ragDataSchema = new mongoose.Schema({
    chunk_id: {
      type: String,
      required: true,
      unique: true
    },
    org_id: {
      type: String,
      required: true
    },
    doc_id: {
      type: String,
      required: true
    },
    chunk: {
      type: String,
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  });

const ragDataModel = mongoose.model("rag_datas", ragDataSchema);

export default ragDataModel;
