import ChatbotDbService from "../db_services/ChatBotDbService.js";
import responsetypeService from "../db_services/responseTypeService.js";
import configurationService from "../db_services/ConfigurationServices.js";
import { filterDataOfBridgeOnTheBaseOfUI } from "../services/utils/getConfiguration.js"
import responseTypeService from "../db_services/responseTypeService.js";
import { getToken } from "../services/utils/usersServices.js";
import token from "../services/commonService/generateToken.js";
import ChatBotDbService from "../db_services/ChatBotDbService.js";
import { generateIdentifier } from "../services/utils/utilityService.js";
import { addorRemoveBridgeInChatBotSchema, addorRemoveResponseIdInBridgeSchema, createChatBotSchema, getChatBotOfBridgeSchema, getViewOnlyChatBotSchema, updateChatBotConfigSchema, updateChatBotSchema } from "../validation/joi_validation/chatbot.js";

const createChatBot = async (req, res) => {
    const { title, type, config } = req.body;
    const userId = req.profile.user.id;
    const orgId = req.profile.org.id;
    const dataToSave = {
        orgId,
        title,
        type,
        createdBy: userId,
        updatedBy: userId,
        config
    }
    await createChatBotSchema.validateAsync(dataToSave);
    const result = await ChatbotDbService.create(dataToSave);
    return res.status(result.success ? 201 : 400).json(result);
};
const getAllChatBots = async (req, res) => {
    const org_id = req.params.orgId;
    const userId = req.profile.user.id;

    if (!org_id) throw new Error('orgId is mandatory');

    const result = await ChatbotDbService.getAll(org_id);
    let chatbots = result.chatbots;

    let defaultChatbot = chatbots.find(chatbot => chatbot.type === 'default');
    let accessKey;
    if (!defaultChatbot) {
        const defaultChatbotData = {
            orgId: org_id,
            title: 'Default Chatbot',
            type: 'default',
            "config": {
                "buttonName": "",
                "height": "100",
                "heightUnit": "%",
                "width": "50",
                "widthUnit": "%",
                "type": "right_slider"
            },
            createdBy: userId,
            updatedBy: userId,
        };
        defaultChatbot = await ChatbotDbService.create(defaultChatbotData);

        chatbots.push(defaultChatbot.chatBot);
    }
    const { chatBot } = await responseTypeService.getAll(org_id);
    if (chatBot?.orgAcessToken) accessKey = chatBot?.orgAcessToken;
    else {
        const org = await responseTypeService.createOrgToken(org_id, generateIdentifier(14))
        accessKey = org.orgData.orgAcessToken
    }
    const chatbot_token = token.generateToken({ payload: { org_id, chatbot_id: defaultChatbot.id, user_id: req.profile.user.id }, accessKey: accessKey })


    return res.status(200).json({ result: { chatbots: chatbots }, chatbot_token });
};
const getOneChatBot = async (req, res) => {
    const { botId } = req.params;
    if (!botId) throw new Error('botId is mandatory');
    const result = await ChatbotDbService.getOne(botId);
    return res.status(result.success ? 200 : 404).json(result);
};
const getViewOnlyChatBot = async (req, res) => {
    const org_id = req.profile.org_id;
    const { botId } = req.params;
    await getViewOnlyChatBotSchema.validateAsync({ org_id, botId });
    const result = await ChatbotDbService.getOneChatBotViewOnly(botId, org_id);
    const orgData = await responseTypeService.getAll(org_id);
    return res.status(result.success ? 200 : 404).json({ ...result, responseTypes: orgData.chatBot.responseTypes });
};
const updateChatBot = async (req, res) => {
    const { botId } = req.params;
    const title = req.body.title;
    await updateChatBotSchema.validateAsync({ botId, title })
    const result = await ChatbotDbService.update(botId, title);
    return res.status(result.success ? 200 : 400).json(result);
};
const deleteChatBot = async (req, res) => {
    const { botId } = req.params;
    if (!botId) throw new Error('botId is mandatory');
    const result = await ChatbotDbService.deleteById(botId);
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

const addorRemoveBridgeInChatBot = async (req, res) => {
    const { type } = req.query;
    const orgId = req.profile.org.id
    const { botId: chatbotId, bridgeId } = req.params;
    await addorRemoveBridgeInChatBotSchema.validateAsync({
        type,
        orgId,
        chatbotId,
        bridgeId,
    })

    try {
        // Determine the operation to perform
        const operation = type === 'add' ? 'addBridgeInChatBot' : 'removeBridgeInChatBot';
        const chatBot = await ChatbotDbService[operation](chatbotId, bridgeId);
        // Fetch and process bridge data
        const result = await configurationService.getBridgesWithSelectedData(bridgeId);
        if (result?.bridges?.bridgeType === "chatbot") {
            result.bridges.chatbotData = await getChatBotOfBridgeFunction(orgId, bridgeId);
        }
        filterDataOfBridgeOnTheBaseOfUI(result, bridgeId, false);

        // Return the combined result
        return res.status(chatBot.success ? 200 : 404).json({ chatBot, result });
    } catch (error) {
        // Handle any unexpected errors
        console.error("Error in addorRemoveBridgeInChatBot:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const addorRemoveResponseIdInBridge = async (req, res) => { // why using status ??
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

    return res.status(result.success ? 200 : 404).json(result?.bridges);
}

const createAllDefaultResponseInOrg = async (req, res) => {
    const orgId = req.params?.orgId;
    if (!orgId) throw new Error('orgId is required')
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
    const orgId = req.profile?.org.id;
    if (!orgId) throw new Error('orgId is required')
    let result;
    result = await responseTypeService.getAll(orgId);
    if (result.chatBot === null) {
        result = await responsetypeService.create(orgId);
    }
    return res.status(result.success ? 200 : 404).json(result);
}
// Core function
const getChatBotOfBridgeFunction = async (orgId, bridgeId) => {
    const { bridges } = await configurationService.findChatbotOfBridge(orgId, bridgeId);
    return bridges;
};

const getChatBotOfBridge = async (req, res) => {
    // const { orgId, bridgeId } = req.params;
    const orgId = req.profile.org.id
    const { bridgeId } = req.params;
    await getChatBotOfBridgeSchema.validateAsync({ orgId, bridgeId })
    const bridges = await getChatBotOfBridgeFunction(orgId, bridgeId);
    return res.status(bridges?.success ? 200 : 404).json(bridges);
};

const updateChatBotConfig = async (req, res) => {
    const { botId } = req.params;
    const { config } = req.body;
    await updateChatBotConfigSchema.validateAsync({ ...config, botId })
    const chatBot = await ChatBotDbService.updateChatbotConfig(botId, config)
    return res.status(chatBot?.success ? 200 : 404).json(chatBot.chatbotData);
}

const loginUser = async (req, res) => {
    try {
        const { chatbot_id, user_id, org_id } = req.chatBot;
        const { exp, iat } = req.chatBot;
        let chatBotConfig = {};
        if (chatbot_id) chatBotConfig = await ChatBotDbService.getChatBotConfig(chatbot_id)
        if (chatBotConfig.orgId !== org_id?.toString()) return res.status(401).json({ success: false, message: "chat bot id is no valid" });
        const dataToSend = {
            config: chatBotConfig.config,
            userId: user_id,
            token: `Bearer ${getToken({ userId: user_id, org_id }, { exp, iat })}`,
            chatbot_id,
        };
        return res.status(200).json({ data: dataToSend, success: true });

    } catch (error) {
        return res.status(400).json({ error: error, success: false });

    }
};

const createOrgToken = async (req, res) => {
    // const { orgId } = req.params;
    const orgId = req.profile.org.id;
    const { chatBot } = await responseTypeService.getAll(orgId);
    if (chatBot?.orgAcessToken) return res.status(200).json(chatBot);
    const org = await responseTypeService.createOrgToken(orgId, generateIdentifier(14))
    return res.status(org?.success ? 200 : 404).json(org.orgData);
};
// for create , removd and update aciton 
const createOrRemoveAction = async (req, res) => {
    const { bridgeId } = req.params;
    const { type } = req.query;
    const { actionJson } = req.body;
    let { actionId } = req.body;

    if (!['add', 'remove'].includes(type)) return res.status(400).json({ error: "Invalid type", success: false });

    if (type !== "remove" && !actionId) // add for create and update the action 
        actionId = generateIdentifier(12);

    try {
        const response = type === 'add'
            ? await configurationService.addActionInBridge(bridgeId, actionId, actionJson)
            : await configurationService.removeActionInBridge(bridgeId, actionId);
        filterDataOfBridgeOnTheBaseOfUI({ bridges: response }, bridgeId, false);

        return res.status(200).json({ success: true, data: response });
    } catch (error) {
        return res.status(400).json({ error: `some error occured ${error?.message}`, success: false });
    }
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
    getViewOnlyChatBot,
    createOrRemoveAction
    // updateChatBotResponse
};