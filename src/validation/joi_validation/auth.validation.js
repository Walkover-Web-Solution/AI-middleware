import Joi from "joi";

const saveAuthTokenSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'name is required'
    }),
    redirection_url: Joi.string().uri().required().messages({
        'any.required': 'redirection_url is required',
        'string.uri': 'redirection_url must be a valid URI'
    })
});

const verifyAuthTokenSchema = Joi.object({
    client_id: Joi.string().required().messages({
        'any.required': 'client_id is required'
    }),
    redirection_url: Joi.string().uri().required().messages({
        'any.required': 'redirection_url is required',
        'string.uri': 'redirection_url must be a valid URI'
    }),
    state: Joi.string().required().messages({
        'any.required': 'state is required'
    })
});

const getClientInfoSchema = Joi.object({
    client_id: Joi.string().required().messages({
        'any.required': 'client_id is required'
    })
});

export {
    saveAuthTokenSchema,
    verifyAuthTokenSchema,
    getClientInfoSchema
};
