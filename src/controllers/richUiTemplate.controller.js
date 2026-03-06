import { createTemplate, getTemplates, updateTemplate, deleteTemplate } from "../db_services/richUiTemplate.service.js";
import { allowedUpdateFields } from "../validation/joi_validation/richUiTemplate.validation.js";
import { extractPlaceholderKeys, buildSchemaFromTemplateFormat, buildSchemaFromKeys, buildDefaultValues } from "../utils/templateVariables.utility.js";

// Create a new rich UI template
export const createRichUiTemplate = async (req, res, next) => {
  let { name, description, json_schema, template_format, is_public, default_json, default_values, ui, variables } = req.body;
  const {
    user: { id: user_id }
  } = req.profile;
  const org_id = req.profile.org.id;

  // Support AI / Frontend payload shape: { ui, variables, template_format }
  // Normalize: if ui is provided but template_format is missing, ui IS the template.
  // But usually, we want template_format to be the RAW version.
  if (ui && !template_format) {
    template_format = ui;
  }

  // variables/default_json seed the initial data
  const initialVariables = variables ?? default_json ?? default_values;

  // Auto-derive json_schema if missing
  let schema = json_schema;
  if (!schema && template_format) {
    schema = buildSchemaFromTemplateFormat(template_format);
  }

  const result = await createTemplate(
    {
      name,
      description,
      json_schema: schema,
      template_format,
      variables: initialVariables,
      default_json: initialVariables,
      ui: ui || null, // preserve the replaced version if sent
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

  const updateData = Object.fromEntries(
    Object.entries(req.body).filter(([key, value]) => allowedUpdateFields.includes(key) && value != null)
  );

  // If template_format changed, regenerate schema and default_json
  if (updateData.template_format) {
    if (!updateData.json_schema) {
      updateData.json_schema = buildSchemaFromTemplateFormat(updateData.template_format);
    }
    if (!updateData.default_json && !updateData.default_values) {
      const regeneratedDefaults = buildDefaultValues(updateData.template_format);
      updateData.default_json = regeneratedDefaults;
      updateData.default_values = regeneratedDefaults;
    }
  }

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
