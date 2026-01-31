import Joi from "joi";

const modelConfigSchema = Joi.object({
  service: Joi.string()
    .valid("openai", "openai_response", "gemini", "anthropic", "groq", "open_router", "mistral", "ai_ml")
    .optional(),
  model_name: Joi.string()
    .pattern(/^[^\s]+$/)
    .message("model_name must not contain spaces")
    .required(),
  status: Joi.number().default(1),
  configuration: Joi.object().unknown(true).required(),
  outputConfig: Joi.object().unknown(true).required(),
  validationConfig: Joi.object().unknown(true).required(),
}).unknown(true);

const saveUserModelConfigurationBodySchema = Joi.object({
  service: Joi.string()
    .valid("openai", "openai_response", "gemini", "anthropic", "groq", "open_router", "mistral", "ai_ml")
    .required(),
  model_name: Joi.string()
    .pattern(/^[^\s]+$/)
    .message("model_name must not contain spaces")
    .required(),
  display_name: Joi.string().required(),
  status: Joi.number().default(1),
  configuration: Joi.object().unknown(true).required(),
  outputConfig: Joi.object().unknown(true).required(),
  validationConfig: Joi.object().unknown(true).required(),
}).unknown(true);

const deleteUserModelConfigurationQuerySchema = Joi.object({
  model_name: Joi.string().required().messages({
    "any.required": "model_name is required",
  }),
  service: Joi.string()
    .valid("openai", "openai_response", "gemini", "anthropic", "groq", "open_router", "mistral", "ai_ml")
    .required()
    .messages({
      "any.required": "service is required",
    }),
}).unknown(true);

// Legacy schema for backward compatibility
const UserModelConfigSchema = Joi.object({
  org_id: Joi.string().required(),
  service: Joi.string()
    .valid("openai", "openai_response", "gemini", "anthropic", "groq", "open_router", "mistral", "ai_ml")
    .required(),
  model_name: Joi.string()
    .pattern(/^[^\s]+$/)
    .message("model_name must not contain spaces")
    .required(),
  display_name: Joi.string().required(),
  status: Joi.number().default(1),
  configuration: Joi.object().unknown(true).required(),
  outputConfig: Joi.object().unknown(true).required(),
  validationConfig: Joi.object().unknown(true).required(),
}).unknown(true);

const getModelInfoByServiceAndTypeQuerySchema = Joi.object({
  service: Joi.string()
    .valid("openai", "gemini", "anthropic", "groq", "grok", "open_router", "mistral", "ai_ml")
    .required()
    .messages({
      "any.required": "service is required",
      "any.only": "service must be one of: openai, gemini, anthropic, groq, grok, open_router, mistral or ai_ml",
    }),
  model_type: Joi.string().valid("chat", "embedding", "image", "reasoning", "fine-tune").optional().messages({
    "any.only": "model_type must be one of: chat, embedding, image, reasoning, fine-tune",
  }),
}).unknown(false);

export {
  modelConfigSchema,
  UserModelConfigSchema,
  saveUserModelConfigurationBodySchema,
  deleteUserModelConfigurationQuerySchema,
  getModelInfoByServiceAndTypeQuerySchema,
};
