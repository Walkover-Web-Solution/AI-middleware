import Joi from "joi";
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

/**
 * Schema for GET /:bridge_id/:thread_id/:sub_thread_id - getConversationLogs
 * Validates URL params and query params
 */
const getConversationLogs = {
  params: Joi.object().keys({
    agent_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'agent_id must be a valid MongoDB ObjectId',
      'any.required': 'agent_id is required'
    }),
    thread_id: Joi.string().required().messages({
      'string.empty': 'thread_id is required',
      'any.required': 'thread_id is required'
    }),
    sub_thread_id: Joi.string().required().messages({
      'string.empty': 'sub_thread_id is required',
      'any.required': 'sub_thread_id is required'
    })
  }),
  query: Joi.object().keys({
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
    user_feedback: Joi.string().optional().default('all'),
    error: Joi.string().optional().default('false')
  })
};

/**
 * Schema for GET /threads/:bridge_id - getRecentThreads
 * Validates URL params and query params
 */
const getRecentThreads = {
  params: Joi.object().keys({
    agent_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'agent_id must be a valid MongoDB ObjectId',
      'any.required': 'agent_id is required'
    })
  }),
  query: Joi.object().keys({
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
    user_feedback: Joi.string().optional().default('all'),
    error: Joi.string().optional().default('false')
  })
};

/**
 * Schema for GET /search/:agent_id - searchConversationLogs
 * Validates URL params and query params
 */
const searchConversationLogs = {
  params: Joi.object().keys({
    agent_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'agent_id must be a valid MongoDB ObjectId',
      'any.required': 'agent_id is required'
    })
  }),
  query: Joi.object().keys({
    keyword: Joi.string().required().messages({
      'string.empty': 'keyword is required',
      'any.required': 'keyword is required'
    }),
    time_range: Joi.object().keys({
      start: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'time_range.start must be a valid ISO date string'
      }),
      end: Joi.string().isoDate().optional().messages({
        'string.isoDate': 'time_range.end must be a valid ISO date string'
      })
    }).optional()
  })
};

export default {
  getConversationLogs,
  getRecentThreads,
  searchConversationLogs
};

