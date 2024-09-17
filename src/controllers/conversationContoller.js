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
const getThreadHistory = async ({ thread_id, org_id, bridge_id, page, pageSize }) => {
  try {
    const chats = await chatbotDbService.findMessage(org_id, thread_id, bridge_id, page, pageSize);
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
const savehistory = async (thread_id, userMessage, botMessage, org_id, bridge_id, model_name, type, messageBy, userRole = "user",tools={}) => {
  try {
    let chatToSave = [{
      thread_id: thread_id,
      org_id: org_id,
      model_name: model_name,
      message: userMessage || "",
      message_by: userRole,
      type: type,
      bridge_id: bridge_id
    }];
    if(Object.keys(tools)?.length>0){
      chatToSave.push({
        thread_id: thread_id,
        org_id: org_id,
        model_name: model_name,
        message: "",
        message_by: "tools_call",
        type: type,
        bridge_id: bridge_id,
        function:  tools
      })
    }
    if (botMessage) {
      chatToSave.push({
        thread_id: thread_id,
        org_id: org_id,
        model_name: model_name,
        message: messageBy != "tool_calls" ? botMessage : "",
        message_by: messageBy,
        type: type,
        bridge_id: bridge_id,
        function: messageBy === "tool_calls" ? botMessage : {}
      });
    }
    if (userRole == "tool") {
      const {
        success
      } = await chatbotDbService.deleteLastThread(org_id, thread_id, bridge_id);
      chatToSave = chatToSave.slice(-1);
      if (!success) {
        // return { success:true,message: "successfully deleted last chat and saved bot response!" }
        return {
          success: false,
          message: "failed to delete last chat!"
        };
      }
    }
    const result = await chatbotDbService.createBulk(chatToSave);
    return {
      success: true,
      message: "successfully saved chat history",
      result: [...result]
    };
  } catch (error) {
    console.error("saveconversation error=>", error);
    return {
      success: false,
      message: error.message
    };
  }
};
export {
  getAllThreads,
  savehistory,
  getThread,
  getThreadHistory,
  getChatData
};