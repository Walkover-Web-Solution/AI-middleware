import Joi from "joi";

const createAuthToken = {
  // No validation needed
};

const saveAuthTokenInDb = {
  body: Joi.object()
    .keys({
      name: Joi.string().required().messages({
        "any.required": "name is required",
      }),
      redirection_url: Joi.string().uri().required().messages({
        "any.required": "redirection_url is required",
        "string.uri": "redirection_url must be a valid URI",
      }),
    })
    .unknown(true),
};

const getAuthTokenInDb = {
  // No validation needed
};

const verifyAuthToken = {
  body: Joi.object()
    .keys({
      client_id: Joi.string().required().messages({
        "any.required": "client_id is required",
      }),
      redirection_url: Joi.string().uri().required().messages({
        "any.required": "redirection_url is required",
        "string.uri": "redirection_url must be a valid URI",
      }),
      state: Joi.string().required().messages({
        "any.required": "state is required",
      }),
    })
    .unknown(true),
};

const getClientInfo = {
  query: Joi.object()
    .keys({
      client_id: Joi.string().required().messages({
        "any.required": "client_id is required",
      }),
    })
    .unknown(true),
};

// Named exports for backward compatibility (used in routes)
const saveAuthTokenSchema = saveAuthTokenInDb.body;
const verifyAuthTokenSchema = verifyAuthToken.body;
const getClientInfoSchema = getClientInfo.query;

export default {
  createAuthToken,
  saveAuthTokenInDb,
  getAuthTokenInDb,
  verifyAuthToken,
  getClientInfo,
};

export { saveAuthTokenSchema, verifyAuthTokenSchema, getClientInfoSchema };
