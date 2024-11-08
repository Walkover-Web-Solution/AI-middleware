import chatbotDbService from "../db_services/conversationDbService.js";

const getAllThreads = async (bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search) => {
  try {
    const chats = await chatbotDbService.findAllThreads(bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search);
    return { success: true, data: chats };
  } catch (err) {
    console.log("getall threads=>", err);
    return { success: false, message: err.message };
  }
};

const getThread = async (thread_id, org_id, bridge_id) => {
  try {
    const chats = await chatbotDbService.find(org_id, thread_id, bridge_id);
    return {
      success: true,
      data: chats
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message
    };
  }
};
const getChatData = async chat_id => {
  try {
    const chat = await chatbotDbService.findChat(chat_id);
    return {
      success: true,
      data: chat
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message
    };
  }
};
const getThreadHistory = async (thread_id, org_id, bridge_id) => {
  try {
    const chats = await chatbotDbService.findMessage(org_id, thread_id, bridge_id);
    return {
      success: true,
      data: chats
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message
    };
  }
};

export {
  getAllThreads,
  getThread,
  getThreadHistory,
  getChatData
};