import Joi from "joi"

const saveApikeySchema = Joi.object({
    name: Joi.string().alphanum().required(),
    apikey: Joi.string().regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/).optional().allow(''),
    service : Joi.string().valid('openai', 'google', 'anthropic', 'groq').required(),
    comment: Joi.string().required()
})

export {
    saveApikeySchema
}