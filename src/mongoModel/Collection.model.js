import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  org_id: {
    type: String,
    required: true,
    index: true
  },
  collection_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  settings: {
    denseModel: {
      type: String,
      default: "BAAI/bge-large-en-v1.5"
    },
    sparseModel: {
      type: String,
      default: "Qdrant/bm25"
    },
    rerankerModel: {
      type: String,
      default: "colbert-ir/colbertv2.0"
    },
    chunkSize: {
      type: Number,
      default: 1000
    },
    chunkOverlap: {
      type: Number,
      default: 100
    }
  },
  
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

collectionSchema.index({ org_id: 1, created_at: -1 });

const collectionModel = mongoose.model("collections", collectionSchema);

export default collectionModel;
