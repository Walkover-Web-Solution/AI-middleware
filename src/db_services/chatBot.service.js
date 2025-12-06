import ChatBotModel from "../mongoModel/ChatBot.model.js";

const create = async chatBotData => {
  try {
    const newChatBot = new ChatBotModel(chatBotData);
    const savedChatBot = await newChatBot.save();
    return {
      success: true,
      chatBot: savedChatBot
    };
  } catch (error) {
    console.log("Error in creating chatbot:", error);
    return {
      success: false,
      error: "Failed to create chatbot"
    };
  }
};

const getAll = async (org_id) => {
  try {
    // Assuming 'bridge' is the field to populate and it contains a 'name' field
    const chatbots = await ChatBotModel.find({ orgId: org_id })
      .populate('bridge', 'name') // Add 'name' to select only the name of the bridge
      .exec(); // Execute the query

    return {
      success: true,
      chatbots
    };
  } catch (error) {
    console.log("Error in fetching chatbots:", error);
    return {
      success: false,
      error: "Failed to retrieve chatbots"
    };
  }
};

const getOne = async (botId) => {
  try {
    const chatbot = await ChatBotModel.findById(botId).populate('bridge')
    if (!chatbot) {
      return { success: false, error: "Chatbot not found" };
    }
    return { success: true, chatbot };
  } catch (error) {
    console.log("Error in fetching chatbot:", error);
    return { success: false, error: "Failed to retrieve chatbot" };
  }
};

export default {
  create,
  getAll,
  getOne
};
