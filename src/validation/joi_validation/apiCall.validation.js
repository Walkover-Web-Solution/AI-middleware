import Joi from "joi";

const getAllApiCalls = {
    // No validation needed
};

const updateApiCalls = {
    params: Joi.object().keys({
        function_id: Joi.string().required().messages({
            'any.required': 'function_id is required'
        })
    }),
    body: Joi.object().keys({
        dataToSend: Joi.object().required().messages({
            'any.required': 'dataToSend is required'
        })
    })
};

const deleteFunction = {
    body: Joi.object().keys({
        function_name: Joi.string().required().messages({
            'any.required': 'function_name is required'
        })
    })
};

const createApi = {
    body: Joi.object().keys({
        id: Joi.string().required().messages({
            'any.required': 'id (function_name) is required'
        }),
        title: Joi.string().optional(),
        desc: Joi.string().required().messages({
            'any.required': 'desc is required'
        }),
        status: Joi.string().valid('published', 'updated', 'delete', 'paused').required().messages({
            'any.required': 'status is required',
            'any.only': 'status must be one of: published, updated, delete, paused'
        }),
        payload: Joi.object().optional()
    })
};

const updateApi = {
    params: Joi.object().keys({
        bridgeId: Joi.string().required().messages({
            'any.required': 'bridgeId is required'
        })
    }),
    body: Joi.object().keys({
        version_id: Joi.string().optional(),
        pre_tools: Joi.string().required().messages({
            'any.required': 'pre_tools is required'
        }),
        status: Joi.string().valid('0', '1').required().messages({
            'any.required': 'status is required',
            'any.only': 'status must be either "0" or "1"'
        })
    })
};

const getAllInBuiltTools = {
    // No validation needed
};

export default {
    getAllApiCalls,
    updateApiCalls,
    deleteFunction,
    createApi,
    updateApi,
    getAllInBuiltTools
};
