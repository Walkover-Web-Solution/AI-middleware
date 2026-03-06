import Joi from "joi";

const createRichUiTemplateSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Template name is required"
  }),
  description: Joi.string().optional().allow(""),
  json_schema: Joi.object().optional(),
  template_format: Joi.object().required().messages({
    "any.required": "Template format is required"
  }),
  default_json: Joi.object().optional(),
  default_values: Joi.object().optional(),
  ui: Joi.object().optional(),
  variables: Joi.object().optional(),
  is_public: Joi.boolean().valid(true, false).optional()
}).unknown(true);

const updateRichUiTemplateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(""),
  json_schema: Joi.object().optional(),
  template_format: Joi.object().optional(),
  default_json: Joi.object().optional(),
  default_values: Joi.object().optional(),
  ui: Joi.object().optional(),
  variables: Joi.object().optional(),
  is_public: Joi.boolean().valid(true, false).optional()
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update"
  })
  .unknown(true);

const templateIdSchema = Joi.object({
  template_id: Joi.string().required().messages({
    "any.required": "Template ID is required"
  })
}).unknown(true);

const allowedUpdateFields = ["name", "description", "json_schema", "template_format", "default_json", "default_values", "ui", "variables", "is_public"];

export { createRichUiTemplateSchema, updateRichUiTemplateSchema, templateIdSchema, allowedUpdateFields };
