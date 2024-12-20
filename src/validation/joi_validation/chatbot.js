import Joi from "joi";
import joiObjectId from 'joi-objectid';
Joi.objectId = joiObjectId(Joi);
const createChatBotSchema = Joi.object({
    orgId: Joi.number().required(),
    title: Joi.string().required(),
    createdBy: Joi.number().required(),
    updatedBy: Joi.number().required(),
})

const updateChatBotSchema = Joi.object({
    botId: Joi.string().required(),
    title: Joi.string().required(),
})
const updateAllDefaultResponseInOrgSchema = Joi.object({})

const updateChatBotConfigSchema = Joi.object({
    buttonName: Joi.string().allow("").required(),
    height: Joi.string().allow("").required(),
    heightUnit: Joi.string().allow("").required(),
    width: Joi.string().allow("").required(),
    widthUnit: Joi.string().allow("").required(),
    type: Joi.string().allow("").required(),
    botId: Joi.string().required(),
    themeColor: Joi.string().required(),
    chatbotTitle: Joi.string().allow("").required(),
    chatbotSubtitle: Joi.string().allow("").required(),
    iconUrl: Joi.string().allow("").optional(),
})

const addorRemoveBridgeInChatBotSchema = Joi.object({
    orgId: Joi.number().required(),
    bridgeId: Joi.string().required(),
    chatbotId: Joi.string().required(),
    type: Joi.string().valid('add', 'remove').required(),
})
const addorRemoveResponseIdInBridgeSchema = Joi.object({
    orgId: Joi.number().required(),
    bridgeId: Joi.string().required(),
    responseId: Joi.string().required(),
    responseJson: Joi.object().required(),
    status: Joi.string().valid('add', 'remove').required(),
})
const getChatBotOfBridgeSchema = Joi.object({
    orgId: Joi.number().required(),
    bridgeId: Joi.string().required(),
})
const getViewOnlyChatBotSchema = Joi.object({
    org_id: Joi.number().required(),
    botId: Joi.string().required(),
})

const chatbotHistoryValidationSchema = Joi.object({
    org_id: Joi.string().required(),
      thread_id: Joi.string().required(),
      bridge_id: Joi.objectId().required()
})
export {
    createChatBotSchema,
    updateChatBotSchema,
    updateAllDefaultResponseInOrgSchema,
    addorRemoveBridgeInChatBotSchema,
    addorRemoveResponseIdInBridgeSchema,
    getChatBotOfBridgeSchema,
    updateChatBotConfigSchema,
    getViewOnlyChatBotSchema,
    chatbotHistoryValidationSchema
}