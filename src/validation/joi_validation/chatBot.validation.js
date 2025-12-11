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

// Legacy schema for backward compatibility (used in configServices.js)
const chatbotHistoryValidationSchema = Joi.object({
    org_id: Joi.string().required(),
    thread_id: Joi.string().required(),
    bridge_id: Joi.objectId().required()
}).unknown(true);

export default {
    subscribe,
    getAllChatBots
};

// Named export for backward compatibility
export {
    chatbotHistoryValidationSchema
};
