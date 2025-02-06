import templateDBservices from "../db_services/templateDBservices.js";

// Controller to get all templates
const getAllTemplates = async (req, res, next) => {
    const {
      org_id
    } = req.body;
    res.locals =  await templateDBservices.getAllTemplate(org_id);
    req.statusCode = 200;
    return next();
};

// Controller to create a new template
const createTemplate = async (req, res, next) => {
  const { templateName, template, org_id } = req.body;
  res.locals = await templateDBservices.createTemplate({ templateName, template, org_id });
  req.statusCode = 201;
  return next();
    
};

// Controller to update a template by ID
const updateTemplate = async (req, res, next) => {
  const { id} = req.params;
  const { templateName, template} = req.body;
  res.locals = await templateDBservices.updateTemplate({ id, templateName, template});
  req.statusCode = 201;
  return next();
};

// Controller to delete a template by ID
const deleteTemplate = async (req, res, next) => {
  const { id } = req.params;
  res.locals =await templateDBservices.deleteTemplate(id);
  req.statusCode = 201;
  return next();
};

export default {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
