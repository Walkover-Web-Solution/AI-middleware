import Joi from "joi";

const createChatBotSchema = Joi.object({})
const getAllChatBotsSchema = Joi.object({})
const getOneChatBotSchema = Joi.object({})
const updateChatBotSchema = Joi.object({})
const deleteChatBotSchema = Joi.object({})
const updateDetailsSchema = Joi.object({})
const updateChatBotActionSchema = Joi.object({})
const createAllDefaultResponseInOrgSchema = Joi.object({})
const updateAllDefaultResponseInOrgSchema = Joi.object({})
const getAllDefaultResponseInOrgSchema = Joi.object({})
const addorRemoveBridgeInChatBotSchema = Joi.object({})
const addorRemoveResponseIdInBridgeSchema = Joi.object({})
const getChatBotOfBridgeSchema = Joi.object({})
const getChatBotOfBridgeFunctionSchema = Joi.object({})
const loginUserSchema = Joi.object({})
const updateChatBotConfigSchema = Joi.object({})
const createOrgTokenSchema = Joi.object({})
const getViewOnlyChatBotSchema = Joi.object({})
export {
    createChatBotSchema,
    getAllChatBotsSchema,
    getOneChatBotSchema,
    updateChatBotSchema,
    deleteChatBotSchema,
    updateDetailsSchema,
    updateChatBotActionSchema,
    createAllDefaultResponseInOrgSchema,
    updateAllDefaultResponseInOrgSchema,
    getAllDefaultResponseInOrgSchema,
    addorRemoveBridgeInChatBotSchema,
    addorRemoveResponseIdInBridgeSchema,
    getChatBotOfBridgeSchema,
    getChatBotOfBridgeFunctionSchema,
    loginUserSchema,
    updateChatBotConfigSchema,
    createOrgTokenSchema,
    getViewOnlyChatBotSchema,
}