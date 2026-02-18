import { createTemplate, getTemplates, updateTemplate, deleteTemplate } from "../db_services/richUiTemplate.service.js";
import { generateSchemaFromCard } from "../utils/Formatter.utility.js";
import { allowedUpdateFields } from "../validation/joi_validation/richUiTemplate.validation.js";

// Create a new rich UI template
export const createRichUiTemplate = async (req, res, next) => {
  const { name, description, json_schema, template_format, html, is_public } = req.body;
  const {
    user: { id: user_id }
  } = req.profile;
  const org_id = req.profile.org.id;

  const schema = json_schema || generateSchemaFromCard(template_format).schema;

  const result = await createTemplate(
    {
      name,
      description,
      json_schema: schema,
      template_format,
      html,
      org_id,
      is_public: is_public ? is_public : false
    },
    user_id
  );

  res.locals = result;
  req.statusCode = 201;
  return next();
};

// Get all templates
export const getRichUiTemplates = async (req, res, next) => {
  const org_id = req.profile.org.id;

  res.locals = await getTemplates(org_id);
  req.statusCode = 200;
  return next();
};

// Update a template
export const updateRichUiTemplate = async (req, res, next) => {
  const { template_id } = req.params;
  const {
    user: { id: user_id }
  } = req.profile;
  const is_public = req.body.is_public ? req.body.is_public : false;

  const updateData = Object.fromEntries(Object.entries(req.body).filter(([key, value]) => allowedUpdateFields.includes(key) && value != null));

  res.locals = await updateTemplate(template_id, updateData, user_id, is_public);
  req.statusCode = 200;
  return next();
};

// Delete a template
export const deleteRichUiTemplate = async (req, res, next) => {
  const { template_id } = req.params;
  const {
    user: { id: user_id }
  } = req.profile;

  res.locals = await deleteTemplate(template_id, user_id);
  req.statusCode = 200;
  return next();
};
