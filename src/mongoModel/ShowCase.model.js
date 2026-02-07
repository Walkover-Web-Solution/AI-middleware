import mongoose from "mongoose";

const showCaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true // Ensures name is unique
  },
  img_url: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

showCaseSchema.index({ name: 1 }, { unique: true });

const showCaseModel = mongoose.model("showCaseModel", showCaseSchema);

export default showCaseModel;
