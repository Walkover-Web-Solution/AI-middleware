import Joi from "joi";

const createAlertSchema = Joi.object({
    org_id : Joi.number().required(),
    webhookConfiguration : Joi.object().required(),
    name : Joi.string().required(),
    bridges : Joi.array().items(Joi.string()).required(),
    alertType : Joi.array().items(Joi.string().valid('thumbsdown','Variable', 'Error', 'metrix_limit_reached', 'retry_mechanism')).required(),
    limit : Joi.number()
})

const getAlertSchema = Joi.object({
    org_id : Joi.number().required(),
})

const updateAlertSchema = Joi.object({
    id : Joi.string().alphanum().required(),
    webhookConfiguration : Joi.object().optional(),
    bridges : Joi.array().items(Joi.string()).optional(),
    name : Joi.string().optional(),
    alertType : Joi.array().items(Joi.string().valid('thumbsdown','Variable', 'Error', 'metrix_limit_reached', 'retry_mechanism')).optional(),
})

const deleteAlertSchema = Joi.object({
    id : Joi.string().alphanum().required(),
})

export default{
    createAlertSchema,
    getAlertSchema,
    deleteAlertSchema,
    updateAlertSchema
};