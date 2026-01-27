import Joi from "joi";
import joiObjectId from "joi-objectid";

Joi.objectId = joiObjectId(Joi);

/**
 * Schema for POST / - createSubThreadController
 * Validates request body
 */
const createSubThread = {
  body: Joi.object()
    .keys({
      thread_id: Joi.string().required().messages({
        "string.empty": "thread_id is required",
        "any.required": "thread_id is required",
      }),
      subThreadId: Joi.string().optional(),
      name: Joi.string().optional().allow(""),
    })
    .unknown(true),
};

/**
 * Schema for POST /ai - createSubThreadWithAiController
 * Validates request body
 */
const createSubThreadWithAi = {
  body: Joi.object()
    .keys({
      thread_id: Joi.string().required().messages({
        "string.empty": "thread_id is required",
        "any.required": "thread_id is required",
      }),
      subThreadId: Joi.string().optional(),
      name: Joi.string().optional().allow(""),
      user: Joi.string().optional().allow(""),
      botId: Joi.string().optional(),
    })
    .unknown(true),
};

/**
 * Schema for GET /:thread_id - getAllSubThreadController
 * Validates URL params and query params
 */
const getAllSubThread = {
  params: Joi.object()
    .keys({
      thread_id: Joi.string().required().messages({
        "string.empty": "thread_id is required",
        "any.required": "thread_id is required",
      }),
    })
    .unknown(true),
  query: Joi.object()
    .keys({
      slugName: Joi.string().optional(),
    })
    .unknown(true),
};

export default {
  createSubThread,
  createSubThreadWithAi,
  getAllSubThread,
};
