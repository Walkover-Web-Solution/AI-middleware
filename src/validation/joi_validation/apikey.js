import Joi from "joi"

const saveApikeySchema = Joi.object({
    name: Joi.string().required(),
    apikey: Joi.string().required(),
    service: Joi.string().valid('openai', 'gemini', 'anthropic', 'groq', 'open_router', 'mistral').required(),
    comment: Joi.string().allow('').optional(),
    folder_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    user_id: Joi.number().optional()
})

const updateApikeySchema = Joi.object({
    name: Joi.string().optional(),
    apikey: Joi.string().optional(),
    apikey_object_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    service : Joi.string().valid('openai', 'gemini', 'anthropic', 'groq', 'open_router', 'mistral').optional(),
    comment: Joi.string().allow('').optional(),
    folder_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    user_id: Joi.number().optional()
})

const deleteApikeySchema = Joi.object({
    apikey_object_id: Joi.string().alphanum().required()
})


export {
    saveApikeySchema,
    updateApikeySchema,
    deleteApikeySchema
}