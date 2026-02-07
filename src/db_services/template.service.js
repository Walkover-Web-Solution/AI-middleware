import templateModel from "../mongoModel/Template.model.js";

async function getAll() {
  return templateModel.find();
}

export default {
  getAll
};
