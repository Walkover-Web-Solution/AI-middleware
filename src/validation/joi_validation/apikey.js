import Joi from "joi"

const saveApikeySchema = Joi.object({
    name: Joi.string().alphanum().required(),
    apikey: Joi.string().required().allow(''),
    service : Joi.string().valid('openai', 'google', 'anthropic', 'groq').required(),
    comment: Joi.string().optional()
})

const updateApikeySchema = Joi.object({
    name: Joi.string().alphanum().optional(),
    apikey: Joi.string().allow(''),
    apikey_object_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    service : Joi.string().valid('openai', 'google', 'anthropic', 'groq').required(),
    comment : Joi.string().optional()
})

const deleteApikeySchema = Joi.object({
    apikey_object_id: Joi.string().alphanum().required()
})


export {
    saveApikeySchema,
    updateApikeySchema,
    deleteApikeySchema
}