import Joi from "joi";

const idSchema = Joi.alternatives().try(Joi.number().integer(), Joi.string().trim().min(1));

/**
 * Schema for POST /metrics - get_metrics_data
 * Validates request body and query parameters
 */
const getMetricsData = {
  query: Joi.object()
    .keys({
      startTime: Joi.string().optional(),
      endTime: Joi.string().optional()
    })
    .unknown(true),
  body: Joi.object()
    .keys({
      apikey_id: idSchema.optional(),
      service: Joi.string().optional(),
      model: Joi.string().optional(),
      thread_id: idSchema.optional(),
      bridge_id: idSchema.optional(),
      version_id: idSchema.optional(),
      range: Joi.number().integer().required().messages({
        "any.required": "range is required",
        "number.base": "range must be a number"
      }),
      factor: Joi.string().required().messages({
        "any.required": "factor is required",
        "string.base": "factor must be a string"
      }),
      start_date: Joi.date().optional(),
      end_date: Joi.date().optional()
    })
    .unknown(true)
};

export default {
  getMetricsData
};
