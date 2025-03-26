import mongoose from "mongoose";

const showCaseTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true, 
      default: "",
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: true, 
      default: "",
    },
    prompt: {
      type: String,
      default: "",
    },
    configuration: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } 
);

showCaseTemplateSchema.index({ title: 1 }, { unique: true });
const showCaseTemplateModel = mongoose.model("showCaseTemplate", showCaseTemplateSchema);

export default showCaseTemplateModel;
