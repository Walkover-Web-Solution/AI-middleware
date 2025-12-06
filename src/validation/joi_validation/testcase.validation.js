import Joi from "joi";

const createTestcaseSchema = Joi.object({
    bridge_id: Joi.string().required().messages({
        'any.required': 'bridge_id is required'
    }),
    conversation: Joi.array().required().messages({
        'any.required': 'conversation is required'
    }),
    type: Joi.string().required().messages({
        'any.required': 'type is required'
    }),
    expected: Joi.string().required().messages({
        'any.required': 'expected is required'
    }),
    matching_type: Joi.string().required().messages({
        'any.required': 'matching_type is required'
    })
});

const testcaseIdSchema = Joi.object({
    testcase_id: Joi.string().required().messages({
        'any.required': 'testcase_id is required'
    })
});

const bridgeIdSchema = Joi.object({
    bridge_id: Joi.string().required().messages({
        'any.required': 'bridge_id is required'
    })
});

export {
    createTestcaseSchema,
    testcaseIdSchema,
    bridgeIdSchema
};
