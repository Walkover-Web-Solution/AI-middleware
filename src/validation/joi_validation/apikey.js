import Joi from "joi"

const saveApikeySchema = Joi.object({
    name: Joi.string().alphanum().required(),
    apikey: Joi.string().regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/).optional().allow(''), // is regex correct and how and why optional ?
    service : Joi.string().valid('openai', 'google', 'anthropic', 'groq').required(),
    comment: Joi.string().required() // why not optional
})

const updateApikeySchema = Joi.object({
    name: Joi.string().alphanum().optional(),
    apikey: Joi.string().regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/).optional().allow(''),
    apikey_object_id: Joi.string().alphanum().required() // why not full regex here
})

const deleteApikeySchema = Joi.object({
    apikey_object_id: Joi.string().alphanum().required()
})



export {
    saveApikeySchema,
    updateApikeySchema,
    deleteApikeySchema
}