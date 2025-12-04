import templateModel from "../mongoModel/template.js";

async function getAll() {
  return templateModel.find();
}

export default {
  getAll,
};
