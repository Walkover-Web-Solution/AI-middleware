import Joi from "joi";

const createChatBotSchema = Joi.object({
    orgId: Joi.number().required(),
    title: Joi.string().required(),
    createdBy: Joi.number().required(),
    updatedBy: Joi.number().required(),
})

const updateChatBotSchema = Joi.object({})
const updateAllDefaultResponseInOrgSchema = Joi.object({})
const updateChatBotConfigSchema = Joi.object({})

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
    responseJson: Joi.string().required(),
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
export {
    createChatBotSchema,
    updateChatBotSchema,
    updateAllDefaultResponseInOrgSchema,
    addorRemoveBridgeInChatBotSchema,
    addorRemoveResponseIdInBridgeSchema,
    getChatBotOfBridgeSchema,
    updateChatBotConfigSchema,
    getViewOnlyChatBotSchema,
}