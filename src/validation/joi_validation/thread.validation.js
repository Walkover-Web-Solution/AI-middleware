import Joi from 'joi';
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

/**
 * Schema for POST / - createThreadController
 * Validates request body
 */
const createThreadBodySchema = Joi.object({
    thread_id: Joi.string().required().messages({
        'string.empty': 'thread_id is required',
        'any.required': 'thread_id is required'
    }),
    subThreadId: Joi.string().optional(),
    name: Joi.string().optional().allow('')
});

/**
 * Schema for POST /new - createSubThreadWithAi
 * Validates request body
 */
const createSubThreadWithAiBodySchema = Joi.object({
    thread_id: Joi.string().required().messages({
        'string.empty': 'thread_id is required',
        'any.required': 'thread_id is required'
    }),
    subThreadId: Joi.string().optional(),
    name: Joi.string().optional().allow(''),
    user: Joi.string().optional().allow(''),
    botId: Joi.string().optional()
});

/**
 * Schema for GET /:thread_id - getAllThreadsController
 * Validates URL params
 */
const getAllThreadsParamsSchema = Joi.object({
    thread_id: Joi.string().required().messages({
        'string.empty': 'thread_id is required',
        'any.required': 'thread_id is required'
    })
});

/**
 * Schema for GET /:thread_id - getAllThreadsController
 * Validates query params
 */
const getAllThreadsQuerySchema = Joi.object({
    slugName: Joi.string().optional()
});

export {
    createThreadBodySchema,
    createSubThreadWithAiBodySchema,
    getAllThreadsParamsSchema,
    getAllThreadsQuerySchema
};
