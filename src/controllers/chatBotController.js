import ChatBotDbService from '../db_services/ChatBotDbService.js';

const createChatBot = async (req, res) => {
    const data = req.body;
    const result = await ChatBotDbService.create(data);
    return res.status(result.success ? 201 : 400).json(result);
};

const getAllChatBots = async (req, res) => {
    const result = await ChatBotDbService.getAll();
    return res.status(result.success ? 200 : 400).json(result);
};

const getOneChatBot = async (req, res) => {
    const botId = req.params.botId;
    const result = await ChatBotDbService.getOne(botId);
    return res.status(result.success ? 200 : 404).json(result);
};

const updateChatBot = async (req, res) => {
    const botId = req.params.botId;
    const result = await ChatBotDbService.update(botId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
};

const deleteChatBot = async (req, res) => {
    const botId = req.params.botId;
    const result = await ChatBotDbService.deleteById(botId);
    return res.status(result.success ? 200 : 404).json(result);
};

export {
    createChatBot,
    getAllChatBots,
    getOneChatBot,
    updateChatBot,
    deleteChatBot
};
