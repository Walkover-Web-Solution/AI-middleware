import Joi from "joi";
export const createChatBotSchema = Joi.object({
    config: Joi.object().required(),
    orgId: Joi.string().required(),
    title: Joi.string().required(),
    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
    bridge: Joi.array().items(
        Joi.string()
    ).optional(),
    frontendActions: Joi.object().required()
}).options({ allowUnknown: false });


export const getAllChatBots = Joi.object({

})
export const getOneChatBot = Joi.object({

})
export const updateChatBot = Joi.object({
    config: Joi.object().required(),
    orgId: Joi.string().required(),
    title: Joi.string().required(),
    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
    bridge: Joi.array().items(
        Joi.string()
    ).optional(),
    frontendActions: Joi.object().required()
}).options({ allowUnknown: false });

export const updateDetails = Joi.object({
    config: Joi.object().required(),
    orgId: Joi.string().required(),
    title: Joi.string().required(),
    createdBy: Joi.string().required(),
    updatedBy: Joi.string().required(),
    bridge: Joi.array().items(
        Joi.string()
    ).optional(),
    frontendActions: Joi.object().required()
}).options({ allowUnknown: false });

export const updateChatBotAction = Joi.object({

})
export const createAllDefaultResponseInOrg = Joi.object({

})
export const updateBridge = Joi.object({

})
export const deleteBridge = Joi.object({

})
export const deleteChatBot = Joi.object({

})
export const addorRemoveResponseIdInBridge = Joi.object({

})
export const sendMessageUsingChatBot = Joi.object({

})
export const getChatBotOfBridge = Joi.object({

})