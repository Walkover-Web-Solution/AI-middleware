const { ChatbotDbService } = require('../db_services/ChatBotDbService');

const createChatBot = async (req, res) => {
    const result = await ChatbotDbService.create(req.body);
    return res.status(result.success ? 201 : 400).json(result);
};

const getAllChatBots = async (req, res) => {
    const result = await ChatbotDbService.getAll();
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

module.exports = {
    createChatBot,
    getAllChatBots,
    getOneChatBot,
    updateChatBot,
    deleteChatBot
};
