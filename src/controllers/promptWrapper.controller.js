import promptWrapperService from "../db_services/promptWrapper.service.js";
import { extractVariables } from "../utils/promptWrapper.utils.js";

const getCreatedBy = (req) => req.profile?.user?.id || null;
const getOrgId = (req) => req.profile?.org?.id || null;

const createPromptWrapper = async (req, res, next) => {
  const created_by = getCreatedBy(req);
  const org_id = getOrgId(req);

  if (!created_by || !org_id) {
    res.locals = { success: false, message: "User ID and Org ID are required" };
    req.statusCode = 400;
    return next();
  }

  const { name, template } = req.body;
  const result = await promptWrapperService.createPromptWrapper({
    name,
    template,
    variables: extractVariables(template),
    org_id,
    created_by,
  });

  res.locals = {
    success: true,
    message: "Prompt wrapper created successfully",
    data: result,
  };
  req.statusCode = 201;
  return next();
};

const getAllPromptWrappers = async (req, res, next) => {
  const org_id = getOrgId(req);

  if (!org_id) {
    res.locals = { success: false, message: "Org ID is required" };
    req.statusCode = 400;
    return next();
  }

  const result = await promptWrapperService.getPromptWrappersByOrg(org_id);
  res.locals = {
    success: true,
    message: "Prompt wrappers retrieved successfully",
    data: result,
  };
  req.statusCode = 200;
  return next();
};

const getPromptWrapperById = async (req, res, next) => {
  const org_id = getOrgId(req);
  const { wrapper_id } = req.params;

  if (!org_id) {
    res.locals = { success: false, message: "Org ID is required" };
    req.statusCode = 400;
    return next();
  }

  const result = await promptWrapperService.getPromptWrapperById(wrapper_id, org_id);

  if (!result) {
    res.locals = { success: false, message: "Prompt wrapper not found" };
    req.statusCode = 404;
    return next();
  }

  res.locals = {
    success: true,
    message: "Prompt wrapper retrieved successfully",
    data: result,
  };
  req.statusCode = 200;
  return next();
};

const updatePromptWrapper = async (req, res, next) => {
  const org_id = getOrgId(req);
  const { wrapper_id } = req.params;
  const { name, template } = req.body;

  if (!org_id) {
    res.locals = { success: false, message: "Org ID is required" };
    req.statusCode = 400;
    return next();
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (template !== undefined) updateData.template = template;
  if (template !== undefined) updateData.variables = extractVariables(template);

  const result = await promptWrapperService.updatePromptWrapperById(wrapper_id, org_id, updateData);

  if (!result) {
    res.locals = { success: false, message: "Prompt wrapper not found" };
    req.statusCode = 404;
    return next();
  }

  res.locals = {
    success: true,
    message: "Prompt wrapper updated successfully",
    data: result,
  };
  req.statusCode = 200;
  return next();
};

const deletePromptWrapper = async (req, res, next) => {
  const org_id = getOrgId(req);
  const { wrapper_id } = req.params;

  if (!org_id) {
    res.locals = { success: false, message: "Org ID is required" };
    req.statusCode = 400;
    return next();
  }

  const result = await promptWrapperService.deletePromptWrapperById(wrapper_id, org_id);

  if (!result) {
    res.locals = { success: false, message: "Prompt wrapper not found" };
    req.statusCode = 404;
    return next();
  }

  res.locals = {
    success: true,
    message: "Prompt wrapper deleted successfully",
  };
  req.statusCode = 200;
  return next();
};

export default {
  createPromptWrapper,
  getAllPromptWrappers,
  getPromptWrapperById,
  updatePromptWrapper,
  deletePromptWrapper,
};
