import mongoose from "mongoose";

const testcaseHistorySchema = new mongoose.Schema(
  {
    testcase_id: {
      type: String,
      required: true
    },
    bridge_id: {
      type: String,
      required: true
    },
    version_id: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      default: 0
    },
    model_output: {
      type: String,
      required: true
    },
    metadata: {
      type: Object,
      default: {}
    },
    created_at: {
      type: String,
      required: true
    }
  },
  {
    timestamps: false,
    strict: false
  }
);

const testcaseHistoryModel = mongoose.model("testcases_history", testcaseHistorySchema);

export default testcaseHistoryModel;
