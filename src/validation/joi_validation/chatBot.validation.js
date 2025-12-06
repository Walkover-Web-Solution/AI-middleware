import Joi from "joi";
import joiObjectId from 'joi-objectid';
Joi.objectId = joiObjectId(Joi);

const chatbotHistoryValidationSchema = Joi.object({
    org_id: Joi.string().required(),
    thread_id: Joi.string().required(),
    bridge_id: Joi.objectId().required()
})

const getAllChatBotsSchema = Joi.object({
    orgId: Joi.number().required().messages({
        'number.base': 'orgId must be a number',
        'any.required': 'orgId is mandatory'
    }),
    userId: Joi.number().required().messages({
        'number.base': 'userId must be a number',
        'any.required': 'userId is mandatory'
    })
})

export {
    chatbotHistoryValidationSchema,
    getAllChatBotsSchema
}
