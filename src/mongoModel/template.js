import mongoose from "mongoose";
const template = new mongoose.Schema({
  template: {
    type: String,
    default: ""
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});
const templateModel = mongoose.model("template", template);
export  {
    templateModel
};