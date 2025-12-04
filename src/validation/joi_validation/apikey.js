import Joi from "joi"

const saveApikeySchema = Joi.object({
    name: Joi.string().required(),
    apikey: Joi.string().required(),
    service: Joi.string().valid('openai', 'gemini', 'anthropic', 'groq', 'open_router', 'mistral', 'ai_ml', 'grok').required(),
    comment: Joi.string().allow('').optional(),
    folder_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    user_id: Joi.number().optional(),
    apikey_limit: Joi.number().min(0).precision(6).optional(),
    apikey_usage: Joi.number().min(0).precision(6).optional()
})

const updateApikeySchema = Joi.object({
    name: Joi.string().optional(),
    apikey: Joi.string().optional(),
    apikey_object_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    service : Joi.string().valid('openai', 'gemini', 'anthropic', 'groq', 'open_router', 'mistral', 'ai_ml', 'grok').optional(),
    comment: Joi.string().allow('').optional(),
    folder_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    user_id: Joi.number().optional(),
    apikey_limit: Joi.number().min(0).precision(6).optional(),
    apikey_usage: Joi.number().min(0).precision(6).optional()
})

const deleteApikeySchema = Joi.object({
    apikey_object_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
        'string.pattern.base': 'apikey_object_id must be a valid MongoDB ObjectId',
        'any.required': 'apikey_object_id is required'
    })
})


export {
    saveApikeySchema,
    updateApikeySchema,
    deleteApikeySchema
}
