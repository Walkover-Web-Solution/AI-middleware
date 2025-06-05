import chatbotDbService from "../db_services/conversationDbService.js";

const getAllThreads = async (bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search,user_feedback, error) => {
  try {
    const chats = await chatbotDbService.findAllThreads(bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search,user_feedback, error);
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
const getThreadHistory = async ({ thread_id, org_id, bridge_id, sub_thread_id, page, pageSize,user_feedback, version_id, isChatbot, error }) => {
  try {
    const chats = await chatbotDbService.findMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize,user_feedback, version_id, isChatbot, error);
    return {
      success: true,
      data: chats?.conversations,
      totalPages:chats?.totalPages,
      totalEnteries:chats?.totalEntries
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message
    };
  }
};
const getThreadHistoryByMessageId = async ({ bridge_id, org_id, thread_id, message_id }) =>  await chatbotDbService.findMessageByMessageId(bridge_id, org_id, thread_id, message_id);

const createThreadHistory = async (payload) => await chatbotDbService.create(payload);


const getThreadMessageHistory = async ({ thread_id, org_id, bridge_id, sub_thread_id, page, pageSize }) => {
    const chats = await chatbotDbService.findThreadMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize);
    return {
      success: true,
      data: chats?.conversations,
    };
};
export {
  getAllThreads,
  getThread,
  getThreadHistory,
  getChatData,
  createThreadHistory,
  getThreadHistoryByMessageId,
  getThreadMessageHistory
};