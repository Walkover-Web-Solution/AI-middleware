import Joi from "joi";
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

const createEmbedSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'name is required',
        'any.required': 'name is required'
    }),
    config: Joi.object().optional().default({}),
    apikey_object_id: Joi.object().pattern(
        Joi.string(),
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    ).optional().default({}),
    folder_limit: Joi.number().min(0).optional().default(0)
});

const updateEmbedSchema = Joi.object({
    folder_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        'string.pattern.base': 'folder_id must be a valid MongoDB ObjectId',
        'any.required': 'folder_id is required'
    }),
    config: Joi.object().optional(),
    apikey_object_id: Joi.object().pattern(
        Joi.string(),
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    ).optional(),
    folder_limit: Joi.number().min(0).optional(),
    folder_usage: Joi.number().min(0).optional()
});

const getEmbedDataByUserIdQuerySchema = Joi.object({
    agent_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
        'string.pattern.base': 'agent_id must be a valid MongoDB ObjectId'
    })
});

export {
    createEmbedSchema,
    updateEmbedSchema,
    getEmbedDataByUserIdQuerySchema
};

