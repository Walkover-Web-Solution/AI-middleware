import { getAllThreads, getThreadHistory } from "../../controllers/conversationContoller.js";
import configurationService from "../../db_services/ConfigurationServices.js";
import {BridgeStatusSchema, updateMessageSchema } from "../../validation/joi_validation/validation.js";
import { convertToTimestamp } from "../../services/utils/getConfiguration.js";
import conversationDbService from "../../db_services/conversationDbService.js";
import { generateIdForOpenAiFunctionCall } from "../utils/utilityService.js";
import { FineTuneSchema } from "../../validation/fineTuneValidation.js";

const getThreads = async (req, res,next) => {
  try {
    let { bridge_id } = req.params
    let page = req?.query?.pageNo || 1;
    let pageSize = req?.query?.limit || 10;
    const {
      thread_id,
      bridge_slugName
    } = req.params;
    const {
      org_id
    } = req.body;
    if (bridge_slugName) {
      bridge_id = (await configurationService.getBridgeIdBySlugname(org_id, bridge_slugName))?.bridgeId
      bridge_id = bridge_id?.toString();
    }
    const threads = await getThreadHistory(thread_id, org_id, bridge_id, page, pageSize);
    res.locals = threads;
    req.statusCode = threads?.success ? 200 : 400;
    return next();
  } catch (error) {
    console.error("common error=>", error)
    throw error;
  }
};
const getMessageHistory = async (req, res, next) => {
  try {
    const { bridge_id } = req.params;
    const { org_id } = req.body;
    const { pageNo = 1, limit = 10, keyword_search = null } = req.query;

    const { startTime, endTime } = req.query;
    let startTimestamp, endTimestamp;

    if (startTime !== 'undefined' && endTime !== 'undefined') {
      startTimestamp = convertToTimestamp(startTime);
      endTimestamp = convertToTimestamp(endTime);
    }

    const threads = await getAllThreads(bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search);
    res.locals = threads;
    req.statusCode = threads?.success ? 200 : 400;
    return next();
  } catch (error) {
    console.error("common error=>", error)
    throw error;
  }
};
const getSystemPromptHistory = async (req, res, next) => {
  try {
    const {
      bridge_id,
      timestamp
    } = req.params;
    const result = await conversationDbService.getHistory(bridge_id, timestamp);
    res.locals = result;
    req.statusCode = result?.success ? 200 : 400;
    return next();
  } catch (error) {
    console.error("error occured", error)
    throw error;
  }
};
const bridgeArchive = async (req, res) => {
  try {
    const { bridge_id } = req.params;
    const { status } = req.body;

    try {
      await BridgeStatusSchema.validateAsync({
        bridge_id,
        status
      });
    } catch (error) {
      return res.status(422).json({
        success: false,
        error: error.details
      });
    }

    const result = await configurationService.updateBridgeArchive(bridge_id, status);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating bridge status =>", error.message);
    return res.status(400).json({
      success: false,
      error: "Something went wrong while update bridge status!!",
    });
  }
};
const deleteBridges = async (req, res,next) => {
  try {
    const {
      bridge_id
    } = req.params;
    const {
      org_id
    } = req.body;
    const result = await configurationService.deleteBridge(bridge_id, org_id);
    res.locals = result;
    req.statusCode = result?.success ? 200 : 400;
    return next();
  } catch (error) {
    console.error("delete bridge error => ", error.message)
    throw error;
  }
};

const FineTuneData = async (req, res, next) => {
  try {
    const { thread_ids, user_feedback } = req.body;
    const org_id = req.profile?.org?.id;
    const { bridge_id } = req.params
    try {
      await FineTuneSchema.validateAsync({
        bridge_id,
        user_feedback
      });
    } catch (error) {
      return res.status(422).json({
        success: false,
        error: error.details
      });
    }

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
  } catch (error) {
    console.error("Error in FineTuneData => ", error.message)
    throw error;
  }
};

const updateThreadMessage = async (req, res, next) => {
  try {
    const { bridge_id } = req.params;
    const { message, id } = req.body;
    const org_id = req.profile?.org?.id;
    try {
      await updateMessageSchema.validateAsync({
        bridge_id,
        message,
        id,
        org_id
      });
    } catch (error) {
      res.locals = { error: error.details };
      req.statusCode = 422
    }
    const result = await conversationDbService.updateMessage({ org_id, bridge_id, message, id });
    res.locals = result;
    req.statusCode = result?.success ? 200 : 400;
    return next();
  } catch (error) {
    console.error("Error in updateThreadMessage => ", error.message)
    throw error;
  }
}

const updateMessageStatus = async (req, res, next) => {
  try {
    const status = req.params.status;
    const message_id = req.body.message_id;
    const result = await conversationDbService.updateStatus({ status, message_id })
    res.locals = result;
    req.statusCode = result?.success ? 200 : 400;
    return next();
  } catch (error) {
    console.error("Error in updateMessageStatus => ", error.message)
    throw error;
  }
}


export default {
  getThreads,
  getMessageHistory,
  bridgeArchive,
  deleteBridges,
  getSystemPromptHistory,
  FineTuneData,
  updateThreadMessage,
  updateMessageStatus
};