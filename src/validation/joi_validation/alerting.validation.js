import Joi from "joi";
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

const createAlertSchema = Joi.object({
    org_id: Joi.number().required().messages({
        'number.base': 'org_id must be a number',
        'any.required': 'org_id is required'
    }),
    webhookConfiguration: Joi.object({
        url: Joi.string().uri().optional(),
        headers: Joi.object().optional()
    }).required().messages({
        'any.required': 'webhookConfiguration is required'
    }),
    name: Joi.string().required().messages({
        'string.empty': 'name is required',
        'any.required': 'name is required'
    }),
    bridges: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).required().messages({
        'array.min': 'bridges must contain at least one bridge ID',
        'any.required': 'bridges is required'
    }),
    alertType: Joi.array().items(
        Joi.string().valid('thumbsdown', 'Variable', 'Error', 'metrix_limit_reached', 'retry_mechanism')
    ).min(1).required().messages({
        'array.min': 'alertType must contain at least one type',
        'any.required': 'alertType is required'
    }),
    limit: Joi.number().min(0).optional()
});

const getAlertSchema = Joi.object({
    org_id: Joi.number().required().messages({
        'number.base': 'org_id must be a number',
        'any.required': 'org_id is required'
    })
});

const updateAlertSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        'string.pattern.base': 'id must be a valid MongoDB ObjectId',
        'any.required': 'id is required'
    }),
    webhookConfiguration: Joi.object({
        url: Joi.string().uri().optional(),
        headers: Joi.object().optional()
    }).optional(),
    bridges: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
    name: Joi.string().optional(),
    alertType: Joi.array().items(
        Joi.string().valid('thumbsdown', 'Variable', 'Error', 'metrix_limit_reached', 'retry_mechanism')
    ).optional()
});

const deleteAlertSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        'string.pattern.base': 'id must be a valid MongoDB ObjectId',
        'any.required': 'id is required'
    })
});

const updateAlertParamSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        'string.pattern.base': 'id must be a valid MongoDB ObjectId',
        'any.required': 'id is required'
    })
});

export default {
    createAlertSchema,
    getAlertSchema,
    deleteAlertSchema,
    updateAlertSchema,
    updateAlertParamSchema
};