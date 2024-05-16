const ChatbotDbService = require('../db_services/ChatBotDbService');
const responsetypeService = require('../db_services/responseTypeService');
const configurationService = require("../db_services/ConfigurationServices");
const createChatBot = async (req, res) => {
    const result = await ChatbotDbService.create(req.body);
    return res.status(result.success ? 201 : 400).json(result);
};

const getAllChatBots = async (req, res) => {
    const org_id = req.params.org_id;
    const result = await ChatbotDbService.getAll(org_id);
    return res.status(result.success ? 200 : 400).json(result);
};

const getOneChatBot = async (req, res) => {
    const result = await ChatbotDbService.getOne(req.params.botId);
    return res.status(result.success ? 200 : 404).json(result);
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
    const dataToSend = { ...req.body };
    const result = await ChatbotDbService.updateDetailsInDb(identifier, dataToSend);
    return res.status(result.success ? 200 : 404).json(result);
};

const updateChatBotAction = async (req, res) => {
    const identifier = req.params?.botId;
    const { componentId, gridId, actionId, actionsArr, frontendActions, frontendActionId } = req.body;
    const result = await ChatbotDbService.updateAction(identifier, componentId, gridId, actionId, actionsArr, frontendActions, frontendActionId);
    return res.status(result.success ? 200 : 404).json(result);
};

const updateBridge = async (req, res) => {
    const chatbotId = req.params?.botId;
    const orgId = req.params?.orgId;
    const { bridgeId } = req.params;
    const { bridges } = await configurationService.getBridges(bridgeId)
    if (bridges.org_id != orgId) return res.status(401).json({ success: false, message: "invalid orgid" });
    const chatBot = await ChatbotDbService.addBridgeInChatBot(chatbotId, bridgeId)
    return res.status(chatBot.success ? 200 : 404).json(chatBot);
};

const deleteBridge = async (req, res) => {
    const chatbotId = req.params?.botId;
    const orgId = req.params?.orgId;
    const { bridgeId } = req.params;
    const { bridges } = await configurationService.getBridges(bridgeId)
    if (bridges.org_id != orgId) return res.status(401).json({ success: false, message: "invalid orgid" });
    const chatBot = await ChatbotDbService.removeBridgeInChatBot(chatbotId, bridgeId)
    return res.status(chatBot.success ? 200 : 404).json(chatBot);
};
const addorRemoveResponseIdInBridge = async (req, res) => {
    const orgId = req.params?.orgId;
    const { bridgeId } = req.params;
    const { responseId, responseJson, status } = req.body;
    if (!responseId) return res.status(400).json({ success: false, message: "responseId is required" });
    let responseRefId = null;
    if (responseJson) {
        responseRefId = await responsetypeService.addResponseTypes(orgId, responseId, responseJson)
    }

    let bridges = null
    // Handle add or remove status
    if (status === 'add') {
        bridges = await configurationService.addResponseIdinBridge(bridgeId, orgId, responseId, responseRefId);
    } else if (status === 'remove') {
        bridges = await configurationService.removeResponseIdinBridge(bridgeId, orgId, responseId);
    } else {
        return res.status(400).json({ success: false, message: "Invalid status value" });
    }


    return res.status(bridges.success ? 200 : 404).json(bridges?.bridges);
}


const createAllDefaultResponseInOrg = async (req, res) => {
    const orgId = req.params?.orgId;
    const result = await responsetypeService.create(orgId)
    return res.status(result.success ? 200 : 404).json(result);
}
const sendMessageUsingChatBot = async (req, res) => {
    const { orgId } = req.body
    const { slugName, threadId } = req.body;
    const { bridges } = await configurationService.getBridgeBySlugname(orgId, slugName);
    bridges?.responseRef?.responseTypes.forEach((response) => {
        console.log(response);

    })

    return res.status(bridges?.success ? 200 : 404).json(bridges);
}
// const getChatBotOfBridge = async (req,res)=>{
//     const {orgId, bridgeId} = req.params 
//     const {bridges} = await configurationService.findChatbotOfBridge(orgId , bridgeId) ;
//     return res.status(bridges?.success ? 200 : 404).json(bridges);
// }

// Core function
const getChatBotOfBridgeFunction = async (orgId, bridgeId) => {
    const { bridges } = await configurationService.findChatbotOfBridge(orgId, bridgeId);
    return bridges;
};

// Express controller function
const getChatBotOfBridge = async (req, res) => {
    const { orgId, bridgeId } = req.params;
    const bridges = await getChatBotOfBridgeFunction(orgId, bridgeId);
    return res.status(bridges?.success ? 200 : 404).json(bridges);
};

module.exports = {
    createChatBot,
    getAllChatBots,
    getOneChatBot,
    updateChatBot,
    deleteChatBot,
    updateDetails,
    updateChatBotAction,
    createAllDefaultResponseInOrg,
    updateBridge,
    deleteBridge,
    addorRemoveResponseIdInBridge,
    sendMessageUsingChatBot,
    getChatBotOfBridge,
    getChatBotOfBridgeFunction
    // updateChatBotResponse
};
