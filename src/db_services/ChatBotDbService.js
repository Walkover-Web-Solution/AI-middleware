import ChatBotModel from "../../mongoModel/chatBotModel.js";
import ActionModel from "../../mongoModel/actionModel.js";
import mongoose from "mongoose";
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
const addBridgeInChatBot = async (chatbotId, bridgeId) => {
    try {
        const updatedChatBot = await ChatBotModel.findByIdAndUpdate({ _id: chatbotId },
            { $addToSet: { bridge: new mongoose.Types.ObjectId(bridgeId) } },
            { new: true },)
        return { success: true, chatBot: updatedChatBot };
    } catch (error) {
        console.log("Error in creating chatbot:", error);
        return { success: false, error: "Failed to create chatbot" };
    }
};
const removeBridgeInChatBot = async (chatbotId, bridgeId) => {
    try {
        const updatedChatBot = await ChatBotModel.findByIdAndUpdate({ _id: chatbotId },
            { $pull: { bridge: bridgeId } },
            { new: true },)
        return { success: true, chatBot: updatedChatBot };
    } catch (error) {
        console.log("Error in creating chatbot:", error);
        return { success: false, error: "Failed to create chatbot" };
    }
};
const getAll = async org_id => {
  try {
    const chatbots = await ChatBotModel.find({
      orgId: org_id
    });
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
        const chatbot = await ChatBotModel.findById(botId).populate('bridge');
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
    const updatedChatBot = await ChatBotModel.findByIdAndUpdate(botId, chatBotData, {
      new: true
    });
    if (!updatedChatBot) {
      return {
        success: false,
        error: "Chatbot not found"
      };
    }
    return {
      success: true,
      chatBot: updatedChatBot
    };
  } catch (error) {
    console.log("Error in updating chatbot:", error);
    return {
      success: false,
      error: "Failed to update chatbot"
    };
  }
};
const deleteById = async botId => {
  try {
    const deletedChatBot = await ChatBotModel.findByIdAndDelete(botId);
    if (!deletedChatBot) {
      return {
        success: false,
        error: "Chatbot not found"
      };
    }
    return {
      success: true,
      message: "Chatbot deleted successfully"
    };
  } catch (error) {
    console.log("Error in deleting chatbot:", error);
    return {
      success: false,
      error: "Failed to delete chatbot"
    };
  }
};
const updateDetailsInDb = async (identifier, dataToSend) => {
  try {
    const updatedChatBot = await ChatBotModel.findByIdAndUpdate(identifier, {
      $set: dataToSend
    }, {
      new: true
    });
    return {
      success: true,
      chatBot: updatedChatBot
    };
  } catch (error) {
    console.log("Error in updating chatbot details:", error);
    return {
      success: false,
      error: "Failed to update chatbot details"
    };
  }
};
const updateAction = async (chatBotId, componentId, gridId, actionId, actionsArr, frontendActions, frontendActionId) => {
  try {
    let response = null;
    const valuesToUpdate = {};
    const valuesToPush = {};
    if (componentId && frontendActions) {
      valuesToUpdate[`frontendActions.${gridId}.${componentId}.${frontendActionId}`] = frontendActions;
    }
    if (actionId) {
      const jsonToSend = {};
      if (actionsArr) jsonToSend.actionsArr = actionsArr;
      response = await ActionModel.findByIdAndUpdate(actionId, {
        $set: jsonToSend
      }, {
        new: true
      });
    } else if (actionsArr) {
      const actionData = {
        chatBotId,
        componentId,
        gridId
      };
      if (actionsArr) actionData.actionsArr = actionsArr;
      response = await ActionModel.create(actionData);
      valuesToPush.actions = {
        actionId: response._id,
        actionIdMapping: response._id,
        componentId,
        gridId
      };
    }
    const updateInterface = await ChatBotModel.findByIdAndUpdate(chatBotId, {
      $set: valuesToUpdate,
      $push: valuesToPush
    }, {
      new: true
    });
    return {
      success: true,
      chatBot: response || updateInterface
    };
  } catch (error) {
    console.log("Error in updating chatbot details:", error);
    return {
      success: false,
      error: "Failed to update actions"
    };
  }
};
const updateResponseTypes = async (chatBotId, responseType, gridId) => {
  try {
    const updatedChatBot = await ChatBotModel.findByIdAndUpdate(chatBotId, {
      $set: {
        [`responseTypes.${gridId}`]: responseType
      }
    }, {
      new: true
    });

    // Check if the chatbot was successfully updated and return response
    if (updatedChatBot) {
      return {
        success: true,
        chatBot: updatedChatBot
      };
    } else {
      return {
        success: false,
        error: "Chatbot not found"
      };
    }
  } catch (error) {
    console.log("Error in updating chatbot details:", error);
    return {
      success: false,
      error: "Failed to update chatbot details"
    };
  }
};

async function getChatBotConfig(botId) {
  return await ChatBotModel.findById({ _id: botId }).select('config');
}

async function updateChatbotConfig(botId , config) {
  try {
    const chatBotData = await InterfaceModel.findByIdAndUpdate(
      {
        _id: botId,
      },
      {
        $set: {
          config :config
        },
      },
      {
        new: true,
      },
    );
    return {success : true , chatbotData :chatBotData}
  }
  catch(e){
    return {success : false ,  error: e.message}
  }
  
}

export default {
  create,
  getAll,
  getOne,
  update,
  deleteById,
  updateDetailsInDb,
  updateAction,
  updateResponseTypes,
  addBridgeInChatBot,
  removeBridgeInChatBot,
  getChatBotConfig,
  updateChatbotConfig
};