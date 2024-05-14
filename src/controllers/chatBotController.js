const { ChatbotDbService } = require('../db_services/ChatBotDbService');

const createChatBot = async (req, res) => {
    const result = await ChatbotDbService.createChatBot(req.body);
    return res.status(result.success ? 201 : 400).json(result);
};

const getAllChatBots = async (req, res) => {
    const result = await getAllChatBots();
    return res.status(result.success ? 200 : 400).json(result);
};

const getOneChatBot = async (req, res) => {
    const result = await getOneChatBot(req.params.botId);
    return res.status(result.success ? 200 : 404).json(result);
};

const updateChatBot = async (req, res) => {
    const result = await updateChatBot(req.params.botId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
};

const deleteChatBot = async (req, res) => {
    const result = await deleteChatBot(req.params.botId);
    return res.status(result.success ? 200 : 404).json(result);
};

module.exports = {
    createChatBot,
    getAllChatBots,
    getOneChatBot,
    updateChatBot,
    deleteChatBot
};
