import ChatbotDbService from "../db_services/ChatBotDbService.js";
import responsetypeService from "../db_services/responseTypeService.js";
import configurationService from "../db_services/ConfigurationServices.js";
import { filterDataOfBridgeOnTheBaseOfUI } from "../services/utils/getConfiguration.js"
import responseTypeService from "../db_services/responseTypeService.js";
import { getToken } from "../services/utils/usersServices.js";
import token from "../services/commonService/generateToken.js";
import ChatBotDbService from "../db_services/ChatBotDbService.js";
import { generateIdentifier } from "../services/utils/utilityService.js";
import { addorRemoveBridgeInChatBotSchema, addorRemoveResponseIdInBridgeSchema, createChatBotSchema, getChatBotOfBridgeSchema, getViewOnlyChatBotSchema, updateChatBotConfigSchema, updateChatBotSchema, createOrRemoveActionValidationSchema } from "../validation/joi_validation/chatbot.js";

const createChatBot = async (req, res, next) => {
    const { title } = req.body;
    const userId = req.profile.user.id;
    const orgId = req.profile.org.id;
    const dataToSave = {
        orgId,
        title,
        createdBy: userId,
        updatedBy: userId,
    }
    await createChatBotSchema.validateAsync(dataToSave);
    const result = await ChatbotDbService.create(dataToSave);
    res.locals = result;
    req.statusCode = result.success ? 201 : 400;
    return next();
};
const getAllChatBots = async (req, res, next) => {
    const org_id = req.params.orgId;
    const userId = req.profile.user.id;

    if (!org_id) throw new Error('orgId is mandatory');

    const result = await ChatbotDbService.getAll(org_id);
    let chatbots = result.chatbots;

    let defaultChatbot = chatbots.find(chatbot => chatbot.type === 'default');
    if (result.chatbots.length === 1 && defaultChatbot) {
        const defaultChatbotData = {
            orgId: org_id,
            title: req.params.name || 'chatbot1',
            createdBy: userId,
            updatedBy: userId,
        };
        await ChatbotDbService.create(defaultChatbotData);
    }
    let accessKey;
    if (!defaultChatbot) {
        const defaultChatbotData = {
            orgId: org_id,
            title: 'Default Chatbot',
            type: 'default',
            createdBy: userId,
            updatedBy: userId,
        };
        defaultChatbot = (await ChatbotDbService.create(defaultChatbotData))?.chatBot;
    }
    const { chatBot } = await responseTypeService.getAll(org_id);
    if (chatBot?.orgAcessToken) accessKey = chatBot?.orgAcessToken;
    else {
        const org = await responseTypeService.createOrgToken(org_id, generateIdentifier(14))
        accessKey = org.orgData.orgAcessToken
    }
    const chatbot_token = token.generateToken({ payload: { org_id, chatbot_id: defaultChatbot.id, user_id: req.profile.user.id }, accessKey: accessKey })

    // Filter out the default chatbot from the chatbots array
    chatbots = chatbots.filter(chatbot => chatbot.type !== 'default');

    res.locals = { result: { chatbots: chatbots }, chatbot_token };
    req.statusCode = 200;
    return next();
};
const getOneChatBot = async (req, res, next) => {
    const { botId } = req.params;
    if (!botId) throw new Error('botId is mandatory');
    const result = await ChatbotDbService.getOne(botId);
    res.locals = result;
    req.statusCode = result.success ? 200 : 404;
    return next();
};
const getViewOnlyChatBot = async (req, res, next) => {
    const org_id = req.profile.org_id;
    const { botId } = req.params;
    await getViewOnlyChatBotSchema.validateAsync({ org_id, botId });
    const result = await ChatbotDbService.getOneChatBotViewOnly(botId, org_id);
    const orgData = await responseTypeService.getAll(org_id);
    res.locals = { ...result, responseTypes: orgData.chatBot.responseTypes };
    req.statusCode = result.success ? 200 : 404;
    return next();
};
const updateChatBot = async (req, res, next) => {
    const { botId } = req.params;
    const title = req.body.title;
    await updateChatBotSchema.validateAsync({ botId, title })
    const result = await ChatbotDbService.update(botId, title);
    res.locals = result;
    req.statusCode = result.success ? 200 : 400;
    return next();
};
const updateChatBotAction = async (req, res) => {
    const identifier = req.params?.botId;
    const {
        componentId,
        gridId,
        actionId,
        actionsArr,
        frontendActions,
        frontendActionId
    } = req.body;
    const result = await ChatbotDbService.updateAction(identifier, componentId, gridId, actionId, actionsArr, frontendActions, frontendActionId);
    res.locals = result;
    req.statusCode = result.success ? 200 : 404;
    return next();
};

const addorRemoveBridgeInChatBot = async (req, res, next) => {
    const { type } = req.query;
    const orgId = req.profile.org.id
    const { botId: chatbotId, bridgeId } = req.params;
    await addorRemoveBridgeInChatBotSchema.validateAsync({
        type,
        orgId,
        chatbotId,
        bridgeId,
    })

    const operation = type === 'add' ? 'addBridgeInChatBot' : 'removeBridgeInChatBot';
    const chatBot = await ChatbotDbService[operation](chatbotId, bridgeId);
    // Fetch and process bridge data
    const result = await configurationService.getBridgesWithSelectedData(bridgeId);
    if (result?.bridges?.bridgeType === "chatbot") {
        result.bridges.chatbotData = await getChatBotOfBridgeFunction(orgId, bridgeId);
    }
    filterDataOfBridgeOnTheBaseOfUI(result, bridgeId, false);

    // Return the combined result
    res.locals = { chatBot, result };
    req.statusCode = chatBot.success ? 200 : 404;
    return next();
};

const addorRemoveResponseIdInBridge = async (req, res, next) => { // why using status ??
    // const orgId = req.params?.orgId;
    const orgId = req.profile?.org.id;
    const { bridgeId } = req.params;
    const { responseId, responseJson, status } = req.body;
    let responseRefId = null;
    await addorRemoveResponseIdInBridgeSchema.validateAsync({
        orgId,
        bridgeId,
        responseId,
        responseJson,
        status,
    })
    if (responseJson) {
        responseRefId = await responsetypeService.addResponseTypes(orgId, responseId, responseJson)
    }

    let result = null
    // Handle add or remove status
    if (status === 'add') {
        result = await configurationService.addResponseIdinBridge(bridgeId, orgId, responseId, responseRefId);
    } else if (status === 'remove') {
        result = await configurationService.removeResponseIdinBridge(bridgeId, orgId, responseId);
    }
    filterDataOfBridgeOnTheBaseOfUI(result, bridgeId, false)

    res.locals = result?.bridges;
    req.statusCode = result.success ? 200 : 404;
    return next();
}

const createAllDefaultResponseInOrg = async (req, res, next) => {
    const orgId = req.params?.orgId;
    if (!orgId) throw new Error('orgId is required')
    const result = await responsetypeService.create(orgId);
    res.locals = result;
    req.statusCode = result.success ? 200 : 404;
    return next();
};

const getAllDefaultResponseInOrg = async (req, res, next) => {
    // const orgId = req.params?.orgId;
    const orgId = req.profile?.org.id;
    if (!orgId) throw new Error('orgId is required')
    let result;
    result = await responseTypeService.getAll(orgId);
    if (result.chatBot === null) {
        result = await responsetypeService.create(orgId);
    }
    res.locals = result;
    req.statusCode = result.success ? 200 : 404;
    return next();
}
// Core function
const getChatBotOfBridgeFunction = async (orgId, bridgeId) => {
    const { bridges } = await configurationService.findChatbotOfBridge(orgId, bridgeId);
    return bridges;
};

const getChatBotOfBridge = async (req, res, next) => {
    // const { orgId, bridgeId } = req.params;
    const orgId = req.profile.org.id
    const { bridgeId } = req.params;
    await getChatBotOfBridgeSchema.validateAsync({ orgId, bridgeId })
    const bridges = await getChatBotOfBridgeFunction(orgId, bridgeId);
    res.locals = bridges;
    req.statusCode = bridges?.success ? 200 : 404;
    return next();
};

const updateChatBotConfig = async (req, res, next) => {
    const { botId } = req.params;
    const { config } = req.body;
    await updateChatBotConfigSchema.validateAsync({ ...config, botId })
    const chatBot = await ChatBotDbService.updateChatbotConfig(botId, config)
    res.locals = chatBot.chatbotData;
    req.statusCode = chatBot?.success ? 200 : 404;
    return next();
}

const loginUser = async (req, res, next) => {
    // {'userId': user_id, "userEmail": user_email, 'ispublic': is_public}
    const { chatbot_id, user_id, org_id, exp, iat, variables, ispublic } = req.chatBot;
    let chatBotConfig = {};
    if (ispublic) {
        const dataToSend = {
            config: {
                "buttonName": "",
                "height": "100",
                "heightUnit": "%",
                "width": "100",
                "widthUnit": "%",
                "type": "popup",
                "themeColor": "#000000"
            },
            userId: req.chatBot.userId,
            token: `Bearer ${getToken({ user_id: req.chatBot.userId, userEmail: req.chatBot.userEmail, org_id: "public", variables, ispublic }, { exp, iat })}`,
            chatbot_id: "Public_Agents",
        };
        res.locals = { data: dataToSend, success: true };
        req.statusCode = 200;
        return next();
    }
    if (chatbot_id) chatBotConfig = await ChatBotDbService.getChatBotConfig(chatbot_id)
    if (chatBotConfig.orgId !== org_id?.toString()) {
        res.locals = { success: false, message: "chat bot id is no valid" };
        req.statusCode = 401;
        return next();
    }
    const dataToSend = {
        config: chatBotConfig.config,
        userId: user_id,
        token: `Bearer ${getToken({ user_id, org_id, variables }, { exp, iat })}`,
        chatbot_id,
    };
    res.locals = { data: dataToSend, success: true };
    req.statusCode = 200;
    return next();
};

const createOrgToken = async (req, res, next) => {
    // const { orgId } = req.params;
    const orgId = req.profile.org.id;
    const { chatBot } = await responseTypeService.getAll(orgId);
    if (chatBot?.orgAcessToken) {
        res.locals = chatBot;
        req.statusCode = 200;
        return next();
    }
    const org = await responseTypeService.createOrgToken(orgId, generateIdentifier(14))
    res.locals = org.orgData;
    req.statusCode = org?.success ? 200 : 404;
    return next();
};
// for create , removd and update aciton 
const createOrRemoveAction = async (req, res, next) => {

    const { bridgeId } = req.params;
    const { type } = req.query;
    const { actionJson, version_id } = req.body;
    let { actionId } = req.body;
    if (type !== "remove" && !actionId) // add for create and update the action 
        actionId = generateIdentifier(12);
    await createOrRemoveActionValidationSchema.validateAsync({ bridgeId, type, actionJson, version_id, actionId });

    const response = type === 'add'
        ? await configurationService.addActionInBridge(bridgeId, actionId, actionJson, version_id)
        : await configurationService.removeActionInBridge(bridgeId, actionId, version_id);
    // filterDataOfBridgeOnTheBaseOfUI({ bridges: response }, bridgeId, false);

    res.locals = { success: true, data: response };
    req.statusCode = 200;
    return next();
};

export {
    createChatBot,
    getAllChatBots,
    getOneChatBot,
    updateChatBot,
    updateChatBotAction,
    createAllDefaultResponseInOrg,
    getAllDefaultResponseInOrg,
    addorRemoveBridgeInChatBot,
    addorRemoveResponseIdInBridge,
    getChatBotOfBridge,
    getChatBotOfBridgeFunction,
    loginUser,
    updateChatBotConfig,
    createOrgToken,
    getViewOnlyChatBot,
    createOrRemoveAction
    // updateChatBotResponse
};
