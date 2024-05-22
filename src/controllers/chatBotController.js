import ChatbotDbService from "../db_services/ChatBotDbService.js";
import responsetypeService from "../db_services/responseTypeService.js";
import configurationService from "../db_services/ConfigurationServices.js";
import { filterDataOfBridgeOnTheBaseOfUI } from "../services/utils/getConfiguration.js"
import responseTypeService from "../db_services/responseTypeService.js";
import { getToken } from "../services/utils/usersServices.js";
import ChatBotDbService from "../db_services/ChatBotDbService.js";
import { nanoid, customAlphabet } from 'nanoid';

const alphabetSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
function generateIdentifier(length = 12, prefix = '', includeNumber = true) {
    const alphabet = includeNumber ? alphabetSet : alphabetSet.slice(0, alphabetSet.length - 10);
    if (alphabet) {
        const custom_nanoid = customAlphabet(alphabet, length);
        return `${prefix}${custom_nanoid()}`;
    }
    return `${prefix}${nanoid(length)}`;
}
// const { filterDataOfBridgeOnTheBaseOfUI } = require('../services/utils/getConfiguration');


const createChatBot = async (req, res) => {
    const result = await ChatbotDbService.create(req.body);
    return res.status(result.success ? 201 : 400).json(result);
};
const getAllChatBots = async (req, res) => {
    // const org_id = req.params.org_id;
    const { org_id: orgId } = req.body
    const result = await ChatbotDbService.getAll(orgId);
    return res.status(result.success ? 200 : 400).json(result);
};
const getOneChatBot = async (req, res) => {
    const result = await ChatbotDbService.getOne(req.params.botId);
    return res.status(result.success ? 200 : 404).json(result);
};
const getViewOnlyChatBot = async (req, res) => {
    const { org_id } = req.body;
    const result = await ChatbotDbService.getOneChatBotViewOnly(req.params.botId, org_id);
    const orgData = await responseTypeService.getAll(org_id);
    return res.status(result.success ? 200 : 404).json({ ...result, responseTypes: orgData.chatBot.responseTypes });
};
const updateChatBot = async (req, res) => {
    const result = await ChatbotDbService.update(req.params.botId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
};
const deleteChatBot = async (req, res) => {
    const result = await ChatbotDbService.deleteById(req.params.botId);
    return res.status(result.success ? 200 : 404).json(result);
};
const updateDetails = async (req, res) => {
    const identifier = req.params?.botId;
    const dataToSend = {
        ...req.body
    };
    const result = await ChatbotDbService.updateDetailsInDb(identifier, dataToSend);
    return res.status(result.success ? 200 : 404).json(result);
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
    return res.status(result.success ? 200 : 404).json(result);
};
// const updateBridge = async (req, res) => {
//     const chatbotId = req.params?.botId;
//     const orgId = req.params?.orgId;
//     const {
//         bridgeId
//     } = req.params;
//     const {
//         bridges
//     } = await configurationService.getBridges(bridgeId);
//     if (bridges.org_id != orgId) return res.status(401).json({
//         success: false,
//         message: "invalid orgid"
//     });
//     const chatBot = await ChatbotDbService.addBridgeInChatBot(chatbotId, bridgeId);
//     return res.status(chatBot.success ? 200 : 404).json(chatBot);
// };
// const deleteBridge = async (req, res) => {
//     const chatbotId = req.params?.botId;
//     const orgId = req.params?.orgId;
//     const {
//         bridgeId
//     } = req.params;
//     const {
//         bridges
//     } = await configurationService.getBridges(bridgeId);
//     if (bridges.org_id != orgId) return res.status(401).json({
//         success: false,
//         message: "invalid orgid"
//     });
//     const chatBot = await ChatbotDbService.removeBridgeInChatBot(chatbotId, bridgeId);
//     return res.status(chatBot.success ? 200 : 404).json(chatBot);
// };

const addorRemoveBridgeInChatBot = async (req, res) => {
    const { type } = req.query;
    const { org_id:orgId } = req.body
    const { botId: chatbotId, bridgeId } = req.params;

    // Validate operation type early
    if (!['add', 'remove'].includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    try {
        // Determine the operation to perform
        const operation = type === 'add' ? 'addBridgeInChatBot' : 'removeBridgeInChatBot';
        const chatBot = await ChatbotDbService[operation](chatbotId, bridgeId);
        // Fetch and process bridge data
        const result = await configurationService.getBridgesWithSelectedData(bridgeId);
        if (result?.bridges?.bridgeType === "chatbot") {
            result.bridges.chatbotData = await getChatBotOfBridgeFunction(orgId, bridgeId);
        }
        filterDataOfBridgeOnTheBaseOfUI(result, bridgeId);

        // Return the combined result
        return res.status(chatBot.success ? 200 : 404).json({ chatBot, result });
    } catch (error) {
        // Handle any unexpected errors
        console.error("Error in addorRemoveBridgeInChatBot:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// const deleteBridge = async (req, res) => {
//     const chatbotId = req.params?.botId;
//     const orgId = req.params?.orgId;
//     const { bridgeId } = req.params;
//     const { bridges } = await configurationService.getBridges(bridgeId)
//     if (bridges.org_id != orgId) return res.status(401).json({ success: false, message: "invalid orgid" });
//     const chatBot = await ChatbotDbService.removeBridgeInChatBot(chatbotId, bridgeId)
//     return res.status(chatBot.success ? 200 : 404).json(chatBot);
// };
const addorRemoveResponseIdInBridge = async (req, res) => { // why using status ??
    // const orgId = req.params?.orgId;
    const orgId = req.body?.org_id;
    const { bridgeId } = req.params;
    const { responseId, responseJson, status } = req.body;
    if (!responseId) return res.status(400).json({ success: false, message: "responseId is required" });
    let responseRefId = null;
    if (responseJson) {
        responseRefId = await responsetypeService.addResponseTypes(orgId, responseId, responseJson)
    }

    let result = null
    // Handle add or remove status
    if (status === 'add') {
        result = await configurationService.addResponseIdinBridge(bridgeId, orgId, responseId, responseRefId);
    } else if (status === 'remove') {
        result = await configurationService.removeResponseIdinBridge(bridgeId, orgId, responseId);
    } else {
        return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    filterDataOfBridgeOnTheBaseOfUI(result, bridgeId)

    return res.status(result.success ? 200 : 404).json(result?.bridges);
}


const createAllDefaultResponseInOrg = async (req, res) => {
    // const orgId = req.params?.orgId;
    const orgId = req.body?.org_id;
    const result = await responsetypeService.create(orgId);
    return res.status(result.success ? 200 : 404).json(result);
};

const updateAllDefaultResponseInOrg = async (req, res) => {
    // const orgId = req.params?.orgId;
    const orgId = req.body?.org_id;
    const { responseJson } = req.body;
    const result = await responsetypeService.update(orgId, responseJson);
    return res.status(result.success ? 200 : 404).json(result);
};

const getAllDefaultResponseInOrg = async (req, res) => {
    // const orgId = req.params?.orgId;
    const orgId = req.body?.org_id;
    const result = await responseTypeService.getAll(orgId)
    return res.status(result.success ? 200 : 404).json(result);
}
// Core function
const getChatBotOfBridgeFunction = async (orgId, bridgeId) => {
    const { bridges } = await configurationService.findChatbotOfBridge(orgId, bridgeId);
    return bridges;
};

const getChatBotOfBridge = async (req, res) => {
    // const { orgId, bridgeId } = req.params;
    const { org_id: orgId } = req.body
    const { bridgeId } = req.params;
    const bridges = await getChatBotOfBridgeFunction(orgId, bridgeId);
    return res.status(bridges?.success ? 200 : 404).json(bridges);
};

const updateChatBotConfig = async (req, res) => {
    const { botId } = req.params;
    const { config } = req.body;
    const chatBot = await ChatBotDbService.updateChatbotConfig(botId, config)
    return res.status(chatBot?.success ? 200 : 404).json(chatBot.chatbotData);
}


const loginUser = async (req, res) => {
    try {
        const { chatbot_id, user_id, org_id } = req.chatBot;
        let chatBotConfig = {};
        if (chatbot_id) chatBotConfig = await ChatBotDbService.getChatBotConfig(chatbot_id)
        if (chatBotConfig.orgId !== org_id) return res.status(401).json({ success: false, message: "chat bot id is no valid" });
        const dataToSend = {
            config: chatBotConfig.config,
            userId: user_id,
            token: `Bearer ${getToken({ userId: user_id, org_id })}`,
            chatbot_id,
        };
        return res.status(200).json({ data: dataToSend, success: true });

    } catch (error) {
        return res.status(400).json({ error: error, success: false });

    }
};


const createOrgToken = async (req, res) => {
    // const { orgId } = req.params;
    const { org_id: orgId } = req.body;
    const { chatBot } = await responseTypeService.getAll(orgId);
    if (chatBot?.orgAcessToken) return res.status(200).json(chatBot);
    const org = await responseTypeService.createOrgToken(orgId, generateIdentifier(14))
    return res.status(org?.success ? 200 : 404).json(org.orgData);
};

export {
    createChatBot,
    getAllChatBots,
    getOneChatBot,
    updateChatBot,
    deleteChatBot,
    updateDetails,
    updateChatBotAction,
    createAllDefaultResponseInOrg,
    updateAllDefaultResponseInOrg,
    getAllDefaultResponseInOrg,
    addorRemoveBridgeInChatBot,
    addorRemoveResponseIdInBridge,
    getChatBotOfBridge,
    getChatBotOfBridgeFunction,
    loginUser,
    updateChatBotConfig,
    createOrgToken,
    getViewOnlyChatBot
    // updateChatBotResponse
};