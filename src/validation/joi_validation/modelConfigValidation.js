import Joi from "joi";

const modelConfigSchema = Joi.object({
    service : Joi.string().valid('openai','openai_response', 'gemini', 'anthropic', 'groq', 'open_router', 'mistral', 'ai_ml').optional(),
    model_name: Joi.string().pattern(/^[^\s]+$/).message('model_name must not contain spaces').required(),
    status: Joi.number().default(1),
    configuration: Joi.object().unknown(true).required(),
    outputConfig: Joi.object().unknown(true).required(),
    validationConfig: Joi.object().unknown(true).required()
});

const UserModelConfigSchema = Joi.object({
    org_id: Joi.string().required(),
    service: Joi.string().valid('openai','openai_response', 'gemini', 'anthropic', 'groq', 'open_router', 'mistral', 'ai_ml').required(),
    model_name: Joi.string().pattern(/^[^\s]+$/).message('model_name must not contain spaces').required(),
    display_name: Joi.string().required(),
    status: Joi.number().default(1),
    configuration: Joi.object().unknown(true).required(),
    outputConfig: Joi.object().unknown(true).required(),
    validationConfig: Joi.object().unknown(true).required()
});

export { modelConfigSchema, UserModelConfigSchema };
