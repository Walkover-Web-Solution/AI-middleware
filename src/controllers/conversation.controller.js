import conversationDbService from "../db_services/conversation.service.js";

const getAllThreads = async (bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search, user_feedback, error, version_id) => {
  try {
    const chats = await conversationDbService.findAllThreads(bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search, user_feedback, error, version_id);
    return { success: true, data: chats };
  } catch (error) {
    console.error("getAllThreads error:", error);
    return { success: false, message: error.message };
  }
};

const getThread = async (thread_id, org_id, bridge_id) => {
  try {
    const chats = await conversationDbService.find(org_id, thread_id, bridge_id);
    return {
      success: true,
      data: chats
    };
  } catch (error) {
    console.error("getThread error:", error);
    return { success: false, message: error.message };
  }
};

const getChatData = async chat_id => {
  try {
    const chat = await conversationDbService.findChat(chat_id);
    return {
      success: true,
      data: chat
    };
  } catch (error) {
    console.error("getChatData error:", error);
    return { success: false, message: error.message };
  }
};

const getThreadHistory = async ({ thread_id, org_id, bridge_id, sub_thread_id, page, pageSize, user_feedback, version_id, isChatbot, error }) => {
  try {
    const chats = await conversationDbService.findMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize, user_feedback, version_id, isChatbot, error);
    return {
      success: true,
      data: chats?.conversations,
      totalPages: chats?.totalPages,
      totalEnteries: chats?.totalEntries
    };
  } catch (error) {
    console.error("getThreadHistory error:", error);
    return { success: false, message: error.message };
  }
};

const getThreadHistoryByMessageId = async ({ bridge_id, org_id, thread_id, message_id }) => {
  try {
    return await conversationDbService.findMessageByMessageId(bridge_id, org_id, thread_id, message_id);
  } catch (error) {
    console.error("getThreadHistoryByMessageId error:", error);
    return { success: false, message: error.message };
  }
};

const createThreadHistory = async (payload) => {
  try {
    return await conversationDbService.create(payload);
  } catch (error) {
    console.error("createThreadHistory error:", error);
    return { success: false, message: error.message };
  }
};

const getThreadMessageHistory = async ({ thread_id, org_id, bridge_id, sub_thread_id, page, pageSize }) => {
  try {
    const chats = await conversationDbService.findThreadMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize);
    return {
      success: true,
      data: chats?.conversations,
    };
  } catch (error) {
    console.error("getThreadMessageHistory error:", error);
    return { success: false, message: error.message };
  }
};

const getAllThreadsUsingKeywordSearch = async ({ bridge_id, org_id, keyword_search, version_id }) => {
  try {
    const chats = await conversationDbService.findAllThreadsUsingKeywordSearch(bridge_id, org_id, keyword_search, version_id);
    return { success: true, data: chats };
  } catch (error) {
    console.error("getAllThreadsUsingKeywordSearch error:", error);
    return { success: false, message: error.message };
  }
}

export {
  getAllThreads,
  getThread,
  getChatData,
  getThreadHistory,
  getThreadHistoryByMessageId,
  createThreadHistory,
  getThreadMessageHistory,
  getAllThreadsUsingKeywordSearch
};