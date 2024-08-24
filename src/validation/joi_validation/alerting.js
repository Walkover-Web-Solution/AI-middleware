import { object, string, array } from 'joi';

const alertSchema = object({
  alertName: string().required().trim(),
  webhookConfiguration: object({
    url: string().uri().required(),
    headers: object().pattern(string(), string())
  }).required(),
  alertType: array().items(string().valid('API Key Expiry', 'Error Occurrence', 'Performance Degradation')).min(1).required(),
  bridges: array().items(string()).default(['all'])
});

const updateAlertSchema = alertSchema.fork(['alertName', 'webhookConfiguration', 'alertType', 'bridges'], (schema) => schema.optional());

const validateAlert = (data) => {
  return alertSchema.validate(data);
};

const validateUpdateAlert = (data) => {
  return updateAlertSchema.validate(data);
};

const validateAlertId = (alertId) => {
  return /^[0-9a-fA-F]{24}$/.test(alertId);
};

const validateQueryParam = (param) => {
  return param && typeof param === 'string';
};

export default {
  validateAlert,
  validateUpdateAlert,
  validateAlertId,
  validateQueryParam
};