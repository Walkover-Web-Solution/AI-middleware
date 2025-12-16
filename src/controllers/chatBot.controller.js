import ChatbotDbService from "../db_services/chatBot.service.js";
import responseTypeService from "../db_services/responseType.service.js";
import configurationService from "../db_services/configuration.service.js";
import token from "../services/commonService/generateToken.js";
import { generateIdentifier } from "../services/utils/utility.service.js";
import { generateToken } from "../services/utils/users.service.js";

const getAllChatBots = async (req, res, next) => {
    const org_id = req.profile.org.id;
    const userId = req.profile.user.id;

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

const updateChatBotConfig = async (req, res, next) => {
    const { botId } = req.params;
    const { config } = req.body;
    
    const chatBot = await ChatbotDbService.updateChatbotConfig(botId, config);
    
    if (!chatBot.success) {
        res.locals = { success: false, message: chatBot.error || "Failed to update chatbot config" };
        req.statusCode = 404;
        return next();
    }
    
    res.locals = chatBot.chatbotData;
    req.statusCode = 200;
    return next();
};

const loginUser = async (req, res, next) => {
    try {
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
                token: `Bearer ${generateToken({ user_id: req.chatBot.userId, userEmail: req.chatBot.userEmail, org_id: "public", variables, ispublic })}`,
                chatbot_id: "Public_Agents",
            };
            res.locals = { data: dataToSend, success: true };
            req.statusCode = 200;
            return next();
        }
        
        if (chatbot_id) {
            const configResult = await ChatbotDbService.getChatBotConfig(chatbot_id);
            // Check if result is an error object (has success property) or the chatbot data
            if (configResult && configResult.success === false) {
                res.locals = { success: false, message: configResult.error || "Chatbot not found" };
                req.statusCode = 404;
                return next();
            }
            if (!configResult) {
                res.locals = { success: false, message: "Chatbot not found" };
                req.statusCode = 404;
                return next();
            }
            chatBotConfig = configResult;
        }
        
        if (!chatBotConfig || chatBotConfig.orgId !== org_id?.toString()) {
            res.locals = { success: false, message: "chat bot id is not valid" };
            req.statusCode = 401;
            return next();
        }
        
        const dataToSend = {
            config: chatBotConfig.config,
            userId: user_id,
            token: `Bearer ${generateToken({ user_id, org_id, variables })}`,
            chatbot_id,
        };
        res.locals = { data: dataToSend, success: true };
        req.statusCode = 200;
        return next();
    } catch (error) {
        res.locals = { success: false, message: error.message || "Failed to login user" };
        req.statusCode = 400;
        return next();
    }
};

const createOrgToken = async (req, res, next) => {
    const orgId = req.profile.org.id;
    const { chatBot } = await responseTypeService.getAll(orgId);
    if (chatBot?.orgAcessToken) {
        res.locals = chatBot;
        req.statusCode = 200;
        return next();
    }
    const org = await responseTypeService.createOrgToken(orgId, generateIdentifier(14));
    res.locals = org?.success ? org.orgData : { success: false, message: "Failed to create org token" };
    req.statusCode = org?.success ? 200 : 404;
    return next();
};

const createOrRemoveAction = async (req, res) => {
    const { agentId } = req.params;
    const { type } = req.query;
    const { actionJson, version_id } = req.body;
    let { actionId } = req.body;
    if (type !== "remove" && !actionId) // add for create and update the action 
        actionId = generateIdentifier(12);
    const response = type === 'add'
        ? await configurationService.addActionInAgent(agentId, actionId, actionJson, version_id)
        : await configurationService.removeActionInAgent(agentId, actionId, version_id);
    // filterDataOfBridgeOnTheBaseOfUI({ bridges: response }, bridgeId, false);
    return res.status(200).json({ success: true, data: response });
};
export { getAllChatBots, updateChatBotConfig, loginUser, createOrgToken, createOrRemoveAction };