import PromptWrapperModel from "../mongoModel/PromptWrapper.model.js";

const createPromptWrapper = async (payload) => {
  return PromptWrapperModel.create(payload);
};

const getPromptWrappersByOrg = async (org_id) => {
  return PromptWrapperModel.find({ org_id }).sort({ created_at: -1 });
};

const getPromptWrapperById = async (wrapperId, org_id) => {
  return PromptWrapperModel.findOne({ _id: wrapperId, org_id });
};

const updatePromptWrapperById = async (wrapperId, org_id, updateData) => {
  return PromptWrapperModel.findOneAndUpdate({ _id: wrapperId, org_id }, { $set: updateData }, { new: true });
};

const deletePromptWrapperById = async (wrapperId, org_id) => {
  return PromptWrapperModel.findOneAndDelete({ _id: wrapperId, org_id });
};

export default {
  createPromptWrapper,
  getPromptWrappersByOrg,
  getPromptWrapperById,
  updatePromptWrapperById,
  deletePromptWrapperById
};
