import Joi from "joi";
import joiObjectId from 'joi-objectid';
Joi.objectId = joiObjectId(Joi);

const subscribe = {
    // No validation needed - uses combinedAuthWithChatBotAndPublicChatbot middleware
};

const getAllChatBots = {
    params: Joi.object().keys({
        orgId: Joi.number().required().messages({
            'number.base': 'orgId must be a number',
            'any.required': 'orgId is mandatory'
        })
    }).unknown(true)
    // userId comes from req.profile.user.id (from middleware)
};

const updateChatBotConfig = {
    params: Joi.object().keys({
        botId: Joi.string().required().messages({
            'string.base': 'botId must be a string',
            'any.required': 'botId is mandatory'
        })
    }).unknown(true),
    body: Joi.object().keys({
        config: Joi.object().required().messages({
            'object.base': 'config must be an object',
            'any.required': 'config is mandatory'
        })
    }).unknown(true)
};

// Legacy schema for backward compatibility (used in configServices.js)
const chatbotHistoryValidationSchema = Joi.object({
    org_id: Joi.string().required(),
    thread_id: Joi.string().required(),
    bridge_id: Joi.objectId().required()
}).unknown(true);

export default {
    subscribe,
    getAllChatBots,
    updateChatBotConfig
};

// Named export for backward compatibility
export {
    chatbotHistoryValidationSchema
};
