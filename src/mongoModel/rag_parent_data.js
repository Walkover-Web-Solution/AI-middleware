import mongoose from "mongoose";

const ragParentDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  doc_id: {
    type: String,
    required: true
  },
  org_id: {
    type: String,
    required: true
  },
  chunks_id_array: {
    type: [String],
    required: true
  },
  user_id: {
    type: String,
    required: false
  }
});

const ragParentDataModel = mongoose.model("rag_parent_datas", ragParentDataSchema);

export default ragParentDataModel;
