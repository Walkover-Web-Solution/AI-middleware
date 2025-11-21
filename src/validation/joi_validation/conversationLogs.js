import Joi from "joi";
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

/**
 * Schema for GET /conversation-logs/:bridge_id/:thread_id/:sub_thread_id
 * Validates URL params
 */
const getConversationLogsParamsSchema = Joi.object({
  bridge_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'bridge_id must be a valid MongoDB ObjectId',
    'any.required': 'bridge_id is required'
  }),
  thread_id: Joi.string().required().messages({
    'string.empty': 'thread_id is required',
    'any.required': 'thread_id is required'
  }),
  sub_thread_id: Joi.string().required().messages({
    'string.empty': 'sub_thread_id is required',
    'any.required': 'sub_thread_id is required'
  }),
  user_feedback: Joi.string().optional().default('all').messages({
    'string.empty': 'user_feedback is required',
    'any.required': 'user_feedback is required'
  }),
  error: Joi.string().optional().default('false').messages({
    'string.empty': 'error is required',
    'any.required': 'error is required'
  })
});

/**
 * Schema for pagination query params
 */
const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be a positive integer'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(30).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must be at most 100'
  }),
  user_feedback: Joi.string().optional().default('all').messages({
    'string.empty': 'user_feedback is required',
    'any.required': 'user_feedback is required'
  }),
  error: Joi.string().optional().default('false').messages({
    'string.empty': 'error is required',
    'any.required': 'error is required'
  })
});

/**
 * Schema for GET /threads/:bridge_id
 * Validates URL params
 */
const getRecentThreadsParamsSchema = Joi.object({
  bridge_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'bridge_id must be a valid MongoDB ObjectId',
    'any.required': 'bridge_id is required'
  })
});

/**
 * Schema for POST /search/:bridge_id
 * Validates URL params
 */
const searchConversationLogsParamsSchema = Joi.object({
  bridge_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'bridge_id must be a valid MongoDB ObjectId',
    'any.required': 'bridge_id is required'
  }),
  org_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'org_id must be a valid MongoDB ObjectId',
    'any.required': 'org_id is required'
  })
});

/**
 * Schema for POST /search/:bridge_id
 * Validates request body
 */
const searchConversationLogsBodySchema = Joi.object({
  keyword: Joi.string().required().messages({
    'string.empty': 'keyword is required',
    'any.required': 'keyword is required'
  }),
  time_range: Joi.object().keys({
    start: Joi.string().isoDate().optional().messages({
      'string.isoDate': 'time_range.start must be a valid ISO date string'
    }).optional(),
    end: Joi.string().isoDate().optional().messages({
      'string.isoDate': 'time_range.end must be a valid ISO date string'
    }).optional()
  }).optional(),
  org_id: Joi.string().optional().messages({
    'string.pattern.base': 'org_id must be a valid MongoDB ObjectId',
    'any.required': 'org_id is required'
  }).optional()
});

export {
  getConversationLogsParamsSchema,
  getRecentThreadsParamsSchema,
  searchConversationLogsParamsSchema,
  searchConversationLogsBodySchema,
  paginationQuerySchema
};

