import ChatbotDbService from "../db_services/chatBot.service.js";
import responseTypeService from "../db_services/responseType.service.js";
import token from "../services/commonService/generateToken.js";
import { generateIdentifier } from "../services/utils/utility.service.js";

const getAllChatBots = async (req, res, next) => {
    const { orgId: org_id } = req.params;
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

export { getAllChatBots };
