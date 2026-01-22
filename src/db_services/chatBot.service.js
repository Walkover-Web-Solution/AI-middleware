import ChatBotModel from "../mongoModel/ChatBot.model.js";

const create = async (chatBotData) => {
  const newChatBot = new ChatBotModel(chatBotData);
  const savedChatBot = await newChatBot.save();
  return savedChatBot;
};

const getAll = async (org_id) => {
  // Assuming 'bridge' is the field to populate and it contains a 'name' field
  const chatbots = await ChatBotModel.find({ orgId: org_id })
    .populate("bridge", "name") // Add 'name' to select only the name of the bridge
    .exec(); // Execute the query
  return chatbots;
};

const getOne = async (botId) => {
  const chatbot = await ChatBotModel.findById(botId).populate("bridge");
  return chatbot;
};

const getChatBotConfig = async (botId) => {
  const chatbot = await ChatBotModel.findById(botId).select({ config: 1, orgId: 1 });
  return chatbot;
};

const updateChatbotConfig = async (botId, config) => {
  const chatBotData = await ChatBotModel.findByIdAndUpdate(botId, { $set: { config: config } }, { new: true });
  return chatBotData;
};

const addBridge = async (botId, bridgeId) => {
  const updatedChatBot = await ChatBotModel.findByIdAndUpdate(
    botId,
    { $addToSet: { bridge: bridgeId } },
    { new: true }
  ).populate("bridge");
  return updatedChatBot;
};

const removeBridge = async (botId, bridgeId) => {
  const updatedChatBot = await ChatBotModel.findByIdAndUpdate(
    botId,
    { $pull: { bridge: bridgeId } },
    { new: true }
  ).populate("bridge");
  return updatedChatBot;
};

const findById = async (botId) => {
  const chatbot = await ChatBotModel.findById(botId);
  return chatbot;
};

export default {
  create,
  getAll,
  getOne,
  getChatBotConfig,
  updateChatbotConfig,
  addBridge,
  removeBridge,
  findById,
};
