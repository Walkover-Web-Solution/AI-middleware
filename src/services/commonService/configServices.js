
import { createThreadHistory, getAllThreads, getAllThreadsUsingKeywordSearch, getThreadMessageHistory } from "../../controllers/conversation.controller.js";
import configurationService from "../../db_services/configuration.service.js";
import { createThreadHistrorySchema } from "../../validation/joi_validation/bridge.js";
import { BridgeStatusSchema, updateMessageSchema } from "../../validation/joi_validation/validation.js";
import { convertToTimestamp } from "../../services/utils/getConfiguration.js";
import conversationDbService from "../../db_services/conversation.service.js";
import { generateIdForOpenAiFunctionCall } from "../../services/utils/utility.service.js";
import { FineTuneSchema } from "../../validation/fineTuneValidation.js";
import { chatbotHistoryValidationSchema } from "../../validation/joi_validation/chatbot.js";
import { send_error_to_webhook } from "../sendErrorWebhook.service.js"
import { findThreadHistoryFormatted } from "../../db_services/history.service.js";

const getThreads = async (req, res, next) => {

  let page = parseInt(req.query.pageNo) || 1;
  let pageSize = parseInt(req.query.limit) || 30;
  let { bridge_id } = req.params;
  const { thread_id, bridge_slugName } = req.params;
  const { sub_thread_id = thread_id } = req.query;
  let { org_id } = req.body;
  let starterQuestion = [];
  let bridge = {};

  if (bridge_slugName) {
    bridge = req.chatBot?.ispublic ? await configurationService.getBridgeByUrlSlugname(bridge_slugName) : await configurationService.getBridgeIdBySlugname(org_id, bridge_slugName);
    bridge_id = bridge?._id?.toString();
    starterQuestion = !bridge?.IsstarterQuestionEnable ? [] : bridge?.starterQuestion;
    org_id = req.chatBot?.ispublic ? bridge?.org_id : org_id;
  }
  let threads = await findThreadHistoryFormatted(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize);
  threads = {
    ...threads,
    starterQuestion,
  }
  res.locals = threads;
  req.statusCode = 200;
  return next();
};
const getMessageHistory = async (req, res, next) => {
  const { bridge_id } = req.params;
  const { org_id } = req.body;
  const { pageNo = 1, limit = 10 } = req.query;
  let keyword_search = req.query?.keyword_search === '' ? null : req.query?.keyword_search;
  const { startTime, endTime, version_id } = req.query;
  let { user_feedback, error } = req.query;
  error = error?.toLowerCase() === 'true' ? true : false;
  let startTimestamp, endTimestamp;
  if (startTime !== 'undefined' && endTime !== 'undefined') {
    startTimestamp = convertToTimestamp(startTime);
    endTimestamp = convertToTimestamp(endTime);
  }

  const threads = keyword_search ? await getAllThreadsUsingKeywordSearch({ bridge_id, org_id, keyword_search, version_id }) : await getAllThreads(bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search, user_feedback, error, version_id);
  res.locals = threads;
  req.statusCode = threads?.success ? 200 : 400;
  return next();
};
const getSystemPromptHistory = async (req, res, next) => {
  const {
    bridge_id,
    timestamp
  } = req.params;
  const result = await conversationDbService.getHistory(bridge_id, timestamp);
  res.locals = result;
  req.statusCode = result?.success ? 200 : 400;
  return next();
};



const deleteBridges = async (req, res, next) => {
  const { bridge_id } = req.params;
  const { org_id, restore = false } = req.body;
  try {

    let result;

    if (restore) {
      // Restore the bridge
      result = await configurationService.restoreBridge(bridge_id, org_id);

      // Log restore operation for audit purposes
      if (result.success) {
        console.log(`Bridge restore completed for bridge ${bridge_id} and ${result.restoredVersionsCount || 0} versions for org ${org_id}`);
      }
    } else {
      // Soft delete the bridge
      result = await configurationService.deleteBridge(bridge_id, org_id);

      // Log soft delete operation for audit purposes
      if (result.success) {
        console.log(`Soft delete initiated for bridge ${bridge_id} and ${result.deletedVersionsCount || 0} versions for org ${org_id}`);
      }
    }

    res.locals = result;
    req.statusCode = result?.success ? 200 : 400;
    return next();
  } catch (error) {
    console.error(`${restore ? 'restore' : 'delete'} bridge error => `, error.message)
    throw error;
  }
};

const FineTuneData = async (req, res, next) => {
  const { thread_ids, user_feedback } = req.body;
  const org_id = req.profile?.org?.id;
  const { bridge_id } = req.params
  await FineTuneSchema.validateAsync({
    bridge_id,
    user_feedback
  });

  let result = [];

  for (const thread_id of thread_ids) {
    const threadData = await conversationDbService.findThreadsForFineTune(
      org_id,
      thread_id,
      bridge_id,
      user_feedback
    );
    const system_prompt = await conversationDbService.system_prompt_data(
      org_id,
      bridge_id
    );
    let filteredData = [];

    for (let i = 0; i < threadData.length; i++) {
      const currentItem = threadData[i];
      const nextItem = threadData[i + 1];
      const nextNextItem = threadData[i + 2];

      if (
        currentItem.role === "user" &&
        nextItem &&
        nextItem.role === "assistant" &&
        nextItem.id === currentItem.id + 1
      ) {
        filteredData.push(currentItem, nextItem);
        i += 1;
      } else if (
        currentItem.role === "user" &&
        nextItem &&
        nextItem.role === "tools_call" &&
        nextNextItem &&
        nextNextItem.role === "assistant"
      ) {
        filteredData.push(currentItem, nextItem, nextNextItem);
        i += 2;
      }
    }
    let messages = [
      {
        role: "system",
        content: system_prompt.system_prompt,
      },
    ];

    for (let i = 0; i < filteredData.length; i++) {
      const item = filteredData[i];

      if (item.role === "tools_call") {
        let toolCalls = [];
        for (const functionStr of Object.values(item.function)) {
          let functionObj = JSON.parse(functionStr);
          toolCalls.push({
            id: generateIdForOpenAiFunctionCall(),
            type: "function",
            function: {
              name: functionObj.name || "",
              arguments: functionObj.arguments || "{}",
            },
            response: functionObj.response || "",
          });
        }

        messages.push({
          role: "assistant",
          tool_calls: toolCalls.map(({ id, type, function: func }) => ({
            id,
            type,
            function: func,
          })),
        });

        for (const toolCall of toolCalls) {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolCall.response,
          });
        }
        if (filteredData[i + 1] && filteredData[i + 1].role === "assistant") {
          const assistantItem = filteredData[i + 1];
          const assistantContent = assistantItem.updated_message !== null ? assistantItem.updated_message : assistantItem.content;
          const message = {
            role: "assistant",
            content: assistantContent
          };
          if (assistantItem.updated_message !== null) {
            message.weight = 1;
          }
          messages.push(message);
          i += 1;
        }
      } else {
        let messageContent = item.content;
        if (item.role === "assistant" && item.updated_message !== null) {
          messageContent = item.updated_message;
        }
        const message = {
          role: item.role,
          content: messageContent,
        }
        if (item.updated_message !== null) {
          message.weight = 1
        }
        messages.push(message);
      }
    }
    if (messages.length > 2) {
      result.push({ messages });
    }
  }

  let jsonlData = result.map((conversation) => JSON.stringify(conversation)).join("\n");
  if (jsonlData == '') {
    jsonlData = {
      "messages": []
    }
  }

  res.locals = { data: jsonlData, contentType: "text/plain" }
  req.statusCode = 200
  return next();
};

const updateThreadMessage = async (req, res, next) => {
  const { bridge_id } = req.params;
  const { message, id } = req.body;
  const org_id = req.profile?.org?.id;
  await updateMessageSchema.validateAsync({
    bridge_id,
    message,
    id,
    org_id
  });
  const result = await conversationDbService.updateMessage({ org_id, bridge_id, message, id });
  res.locals = result;
  req.statusCode = result?.success ? 200 : 400;
  return next();
}

const updateMessageStatus = async (req, res, next) => {
  const status = req.params.status;
  const message_id = req.body.message_id;
  const bridge_id = req.body.bridge_id;
  const org_id = req.profile.org_id;
  let error_message = "User reacted thumbs down on response"
  if (status === "2") {
    sendError(bridge_id, org_id, error_message, "thumbsdown");
  }
  const result = await conversationDbService.updateStatus({ status, message_id })
  res.locals = result;
  req.statusCode = result?.success ? 200 : 400;
  return next();
}

const sendError = async (bridge_id, org_id, error_message, error_type) => {
  send_error_to_webhook(bridge_id, org_id, error_message, error_type);
}

const userFeedbackCount = async (req, res, next) => {
  const bridge_id = req.params.bridge_id;
  const { startDate, endDate, user_feedback } = req.query;

  const result = await conversationDbService.userFeedbackCounts({ bridge_id, startDate, endDate, user_feedback })
  res.locals = result;
  req.statusCode = 200
  return next();
}

const bridgeArchive = async (req, res, next) => {
  const { bridge_id } = req.params;
  const { status } = req.body;

  await BridgeStatusSchema.validateAsync({
    bridge_id,
    status
  });

  const result = await configurationService.updateBridgeArchive(bridge_id, status);

  res.locals = result;
  req.statusCode = 200;
  return next();
};

export const createEntry = async (req, res, next) => {
  const {
    thread_id,
    bridge_id
  } = req.params;
  const {
    message
  } = req.body;
  const message_id = crypto.randomUUID();
  const org_id = req.profile.org.id
  const result = (await configurationService.getBridges(bridge_id))?.bridges;
  const payload = {
    thread_id: thread_id,
    org_id: org_id,
    bridge_id: bridge_id,
    model_name: result?.configuration?.model,
    message: message,
    type: "chat",
    message_by: "assistant",
    message_id: message_id,
    sub_thread_id: thread_id
  }
  await createThreadHistrorySchema.validateAsync(payload);
  const threads = await createThreadHistory(payload);
  res.locals = threads;
  req.statusCode = 200;
  return next();
};

const extraThreadID = async (req, res, next) => {
  const type = req.query?.type || "user";
  const thread_id = req.body.thread_id;
  const message_id = req.body.message_id;
  const result = await conversationDbService.addThreadId(message_id, thread_id, type);
  res.locals = result;
  req.statusCode = 200;
  return next();
};

const getThreadMessages = async (req, res, next) => {
  let { bridge_id } = req.params;
  let page = parseInt(req.query.pageNo) || null;
  let pageSize = parseInt(req.query.limit) || null;
  const { thread_id, bridge_slugName } = req.params;
  const { sub_thread_id = thread_id } = req.query;
  const org_id = req.profile.org?.id || req.profile.org_id;
  let bridge = {};

  if (bridge_slugName) {
    bridge = await configurationService.getBridgeIdBySlugname(org_id, bridge_slugName);
    bridge_id = bridge?._id?.toString();
  }
  await chatbotHistoryValidationSchema.validateAsync({ org_id, bridge_id, thread_id });
  let threads = await getThreadMessageHistory({ bridge_id, org_id, thread_id, sub_thread_id, page, pageSize });
  res.locals = threads;
  req.statusCode = 200;
  return next();
}

const getAllSubThreadsController = async (req, res, next) => {
  const { thread_id } = req.params;
  const { bridge_id, error, version_id } = req.query;
  const isError = error === "false" ? false : true;
  const org_id = req.profile.org.id
  const threads = await conversationDbService.getSubThreads(org_id, thread_id, bridge_id);
  if (isError || version_id) {
    const sub_thread_ids = await conversationDbService.getSubThreadsByError(org_id, thread_id, bridge_id, version_id, isError);
    const threadsWithDisplayNames = sub_thread_ids.map(sub_thread_id => {
      const thread = threads.find(t => t.sub_thread_id === sub_thread_id);
      return {
        sub_thread_id,
        display_name: thread ? thread.display_name : sub_thread_id
      };
    });
    return res.status(200).json({ threads: threadsWithDisplayNames, success: true });
  }
  // sort the threads accroing to their hits in PG.
  const sortedThreads = await conversationDbService.sortThreadsByHits(threads);
  res.locals = { threads: sortedThreads, success: true };
  req.statusCode = 200;
  return next();
}
const getAllUserUpdates = async (req, res, next) => {
  const { version_id } = req.params;
  const org_id = req.profile.org.id
  let page = parseInt(req.query.page) || null;
  let pageSize = parseInt(req.query.limit) || null;
  const userData = await conversationDbService.getUserUpdates(org_id, version_id, page, pageSize);
  res.locals = { userData, success: true };
  req.statusCode = 200;
  return next();
}


export default {
  getThreads,
  getMessageHistory,
  bridgeArchive,
  deleteBridges,
  getSystemPromptHistory,
  FineTuneData,
  updateThreadMessage,
  updateMessageStatus,
  createEntry,
  extraThreadID,
  userFeedbackCount,
  getThreadMessages,
  getAllSubThreadsController,
  getAllUserUpdates
} 
