const ChatBotModel = require("../../mongoModel/chatBotModel");

const create = async (chatBotData) => {
    try {
        const newChatBot = new ChatBotModel(chatBotData);
        const savedChatBot = await newChatBot.save();
        return { success: true, chatBot: savedChatBot };
    } catch (error) {
        console.log("Error in creating chatbot:", error);
        return { success: false, error: "Failed to create chatbot" };
    }
};

const getAll = async () => {
    try {
        const chatbots = await ChatBotModel.find();
        return { success: true, chatbots };
    } catch (error) {
        console.log("Error in fetching chatbots:", error);
        return { success: false, error: "Failed to retrieve chatbots" };
    }
};

const getOne = async (botId) => {
    try {
        const chatbot = await ChatBotModel.findById(botId);
        if (!chatbot) {
            return { success: false, error: "Chatbot not found" };
        }
        return { success: true, chatbot };
    } catch (error) {
        console.log("Error in fetching chatbot:", error);
        return { success: false, error: "Failed to retrieve chatbot" };
    }
};

const update = async (botId, chatBotData) => {
    try {
        const updatedChatBot = await ChatBotModel.findByIdAndUpdate(botId, chatBotData, { new: true });
        if (!updatedChatBot) {
            return { success: false, error: "Chatbot not found" };
        }
        return { success: true, chatBot: updatedChatBot };
    } catch (error) {
        console.log("Error in updating chatbot:", error);
        return { success: false, error: "Failed to update chatbot" };
    }
};

const deleteById = async (botId) => {
    try {
        const deletedChatBot = await ChatBotModel.findByIdAndDelete(botId);
        if (!deletedChatBot) {
            return { success: false, error: "Chatbot not found" };
        }
        return { success: true, message: "Chatbot deleted successfully" };
    } catch (error) {
        console.log("Error in deleting chatbot:", error);
        return { success: false, error: "Failed to delete chatbot" };
    }
};

const updateDetailsInDb = async (identifier, dataToSend) => {
    try {
        const updatedChatBot = await ChatBotModel.findByIdAndUpdate(
            identifier,
            { $set: dataToSend },
            { new: true }
        );
        return { success: true, chatBot: updatedChatBot };
    } catch (error) {
        console.log("Error in updating chatbot details:", error);
        return { success: false, error: "Failed to update chatbot details" };
    }
}

module.exports = {
    create, getAll,
    getOne, update,
    deleteById,
    updateDetailsInDb
};