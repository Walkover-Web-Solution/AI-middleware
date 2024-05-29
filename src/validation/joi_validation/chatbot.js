import Joi from "joi";

const createChatBotSchema = Joi.object({
    orgId: Joi.number(),
    title: Joi.string(),
    createdBy: Joi.number(),
    updatedBy: Joi.number(),
})

const updateChatBotSchema = Joi.object({})
const updateDetailsSchema = Joi.object({})
const updateChatBotActionSchema = Joi.object({})
const updateAllDefaultResponseInOrgSchema = Joi.object({})
const addorRemoveBridgeInChatBotSchema = Joi.object({})
const addorRemoveResponseIdInBridgeSchema = Joi.object({})
const getChatBotOfBridgeSchema = Joi.object({
    orgId: Joi.string(),
    bridgeId: Joi.string(),
})
const updateChatBotConfigSchema = Joi.object({})
const getViewOnlyChatBotSchema = Joi.object({
    org_id: Joi.number(),
    botId: Joi.string(),
})
export {
    createChatBotSchema,
    updateChatBotSchema,
    updateDetailsSchema,
    updateChatBotActionSchema,
    updateAllDefaultResponseInOrgSchema,
    addorRemoveBridgeInChatBotSchema,
    addorRemoveResponseIdInBridgeSchema,
    getChatBotOfBridgeSchema,
    updateChatBotConfigSchema,
    getViewOnlyChatBotSchema,
}