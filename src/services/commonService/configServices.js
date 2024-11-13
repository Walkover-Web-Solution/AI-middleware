import ModelsConfig from "../../configs/modelConfiguration.js";
import { services } from "../../configs/models.js";
import { getAllThreads, getThreadHistory } from "../../controllers/conversationContoller.js";
import configurationService from "../../db_services/ConfigurationServices.js";
import helper from "../../services/utils/helper.js";
import { updateBridgeSchema } from "../../validation/joi_validation/bridge.js";
import { BridgeStatusSchema, updateMessageSchema } from "../../validation/joi_validation/validation.js";
import { convertToTimestamp, filterDataOfBridgeOnTheBaseOfUI } from "../../services/utils/getConfiguration.js";
import conversationDbService from "../../db_services/conversationDbService.js";
import _ from "lodash";
import { getChatBotOfBridgeFunction } from "../../controllers/chatBotController.js";
import { generateIdForOpenAiFunctionCall } from "../utils/utilityService.js";
import { FineTuneSchema } from "../../validation/fineTuneValidation.js";
import { getHistory } from "../../utils/helloUtils.js";
const getAIModels = async (req, res) => {
  try {
    const service = req?.params?.service ? req?.params?.service.toLowerCase() : '';
    if (!(service in services)) {
      return res.status(400).json({
        success: false,
        error: "service does not exist!"
      });
    }
    let modelInfo = {};
    for (const model of services[service]["models"].values()) {
      const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
      const modelfunc = ModelsConfig[modelname];
      let modelConfig = modelfunc().configuration;
      modelInfo[modelname] = modelConfig;
    }
    return res.status(200).json({
      sucess: true,
      models: Array.from(services[service]["models"]),
      type: {
        embeddings: Array.from(services[service]["embedding"]),
        completions: Array.from(services[service]["completion"]),
        chats: Array.from(services[service]["chat"])
      },
      modelInfo: modelInfo
    });
  } catch (error) {
    console.error("common error=>", error);
    return res.status(400).json({
      success: false,
      error: "something went wrong!!"
    });
  }
};
const getThreads = async (req, res, next) => {
  try {
    let { bridge_id } = req.params
    let page = req?.query?.pageNo || 1;
    let pageSize = req?.query?.limit || 10;
    let helloAuth = req.headers.helloAuth;
    let channelId = req.query.channelId

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
    let helloChat, threads;
    if (helloAuth) {
      [helloChat, threads] = await Promise.all([
        getHistory(helloAuth, channelId),
        getThreadHistory(thread_id, org_id, bridge_id, page, pageSize)
      ]);
    } else {
      threads = await getThreadHistory(thread_id, org_id, bridge_id, page, pageSize);
    }
    res.locals = {...threads, helloChat};
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
const getAllSystemPromptHistory = async (req, res, next) => {
  try {
    const bridge_id = req.params.bridge_id;
    let page = req?.query?.pageNo || 1;
    let pageSize = req?.query?.limit || 10;
    const result = await conversationDbService.getAllPromptHistory(bridge_id, page, pageSize);
    res.locals = result;
    req.statusCode = result?.success ? 200 : 400;
    return next();
  } catch (error) {
    console.error("error occured", error)
    throw error;
  }
};
const createBridges = async (req, res) => {
  try {
    let {
      configuration,
      org_id,
      service,
      bridgeType
    } = req.body;
    service = service ? service.toLowerCase() : "";
    if (!(service in services)) {
      return res.status(400).json({
        success: false,
        error: "The specified service does not exist!"
      });
    }

    // Check if the bridge name and slugName are unique
    const bridgeData = await configurationService.getBridgesBySlugNameAndName(configuration?.slugName, configuration?.name, org_id);
    if (bridgeData.success && bridgeData.bridges) {
      if (bridgeData.bridges.name === configuration?.name) {
        return res.status(400).json({
          success: false,
          error: "Bridge name already exists! Please choose a unique one."
        });
      }
      if (bridgeData.bridges.slugName === configuration?.slugName) {
        return res.status(400).json({
          success: false,
          error: "Slug name already exists! Please choose a unique one."
        });
      }
    }

    const result = await configurationService.createBridges({
      configuration: configuration,
      org_id,
      name: configuration?.name,
      slugName: configuration?.slugName,
      service: service,
      apikey: helper.encrypt(""),
      bridgeType
    });
    if (result.success) {
      return res.status(200).json({
        ...result
      });
    }
    return res.status(400).json(result);
  } catch (error) {
    console.error("common error=>", error);
    return res.status(400).json({
      success: false,
      error: "An unexpected error occurred while creating the bridge. Please try again later."
    });
  }
};
const getAllBridges = async (req, res) => {
  try {
    const {
      org_id
    } = req.body;
    const result = await configurationService.getAllBridges(org_id);
    if (result.success) {
      return res.status(200).json({
        ...result,
        org_id: org_id
      });
    }
    return res.status(400).json(result);
  } catch (error) {
    console.error("getall bridge error=>", error.message);
    return res.status(400).json({
      success: false,
      error: "something went wrong!!"
    });
  }
};
const getBridges = async (req, res) => {
  try {
    // console.log(req.params,res);
    const {
      bridge_id
    } = req.params;
    const {
      org_id
    } = req.body;
    const result = await configurationService.getBridgesWithSelectedData(bridge_id);
    if (result?.bridges?.bridgeType === "chatbot") {
      result.bridges.chatbotData = await getChatBotOfBridgeFunction(org_id, bridge_id);
    }
    if (!result.success) {
      return res.status(400).json(result);
    }
    filterDataOfBridgeOnTheBaseOfUI(result, bridge_id);
    return res.status(200).json({
      ...result
    });
  } catch (error) {
    console.error("common error=>", error);
    return res.status(400).json({
      success: false,
      error: "something went wrong!!"
    });
  }
};
const updateBridges = async (req, res) => {
  try {
    const {
      bridge_id
    } = req.params;
    let {
      configuration,
      org_id,
      service,
      apikey,
      bridgeType,
      slugName
    } = req.body;
    try {
      await updateBridgeSchema.validateAsync({
        bridge_id,
        configuration,
        org_id,
        service,
        apikey,
        bridgeType,
        slugName
      });
    } catch (error) {
      return res.status(422).json({
        success: false,
        error: error.details
      });
    }
    configuration["service"] = service;
    let modelConfig = await configurationService.getBridges(bridge_id);
    let bridge = modelConfig?.bridges;
    service = service ? service.toLowerCase() : "";
    if (!(service in services)) {
      return res.status(400).json({
        success: false,
        error: "service does not exist!"
      });
    }
    apikey = !apikey ? bridge.apikey : helper.encrypt(apikey);
    const model = configuration.model;
    const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
    const contentLocation = ModelsConfig[modelname]().inputConfig?.content_location;
    const promptText = _.get(configuration, contentLocation);
    await conversationDbService.storeSystemPrompt(promptText, org_id, bridge_id);
    let prev_configuration = helper.updateConfiguration(bridge.configuration, configuration);
    const result = await configurationService.updateBridges(bridge_id, prev_configuration, org_id, apikey, bridgeType, slugName);
    filterDataOfBridgeOnTheBaseOfUI(result, bridge_id, false);
    if (result?.bridges?.bridgeType === "chatbot") {
      result.bridges.chatbotData = await getChatBotOfBridgeFunction(org_id, bridge_id);
    }
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(422).json({
      success: false,
      error: error.message
    });
  }
};
const updateBridgeType = async (req, res) => {
  try {
    const {
      bridge_id
    } = req.params;
    let {
      bridgeType,
      org_id
    } = req.body;
    const result = await configurationService.updateBridgeType(bridge_id, org_id, bridgeType);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    console.error("error:", error);
    return res.status(400).json({
      success: false,
      error: "something went wrong!!"
    });
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

const deleteBridges = async (req, res, next) => {
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
const getAndUpdate = async (apiObjectID, bridge_id, org_id, openApiFormat, endpoint, requiredParams, status = "add") => {
  try {
    let modelConfig = await configurationService.getBridges(bridge_id);
    let tools_call = modelConfig?.bridges?.configuration?.tools ? modelConfig?.bridges?.configuration?.tools : [];
    let api_endpoints = modelConfig?.bridges?.api_endpoints ? modelConfig.bridges.api_endpoints : [];
    let api_call = modelConfig?.bridges?.api_call ? modelConfig.bridges.api_call : {};
    if (!(endpoint in api_call)) {
      api_endpoints.push(endpoint);
    }
    let updated_tools_call = [];
    tools_call.forEach(tool => {
      if (tool.function.name !== endpoint) {
        updated_tools_call.push(tool);
      }
    });
    if (status === "add") {
      updated_tools_call.push(openApiFormat);
      api_call[endpoint] = {
        apiObjectID: apiObjectID,
        requiredParams: requiredParams
      };
    }
    if (status === "delete") {
      api_endpoints = api_endpoints.filter(item => item !== endpoint);
      api_call && delete api_call[endpoint];
    }
    tools_call = updated_tools_call;
    let configuration = {
      tools: tools_call
    };
    const newConfiguration = helper.updateConfiguration(modelConfig.bridges.configuration, configuration);
    let result = await configurationService.updateToolsCalls(bridge_id, org_id, newConfiguration, api_endpoints, api_call);
    result.tools_call = tools_call;
    return result;
  } catch (error) {
    console.error("error:", error);
    return {
      success: false,
      error: "something went wrong!!"
    };
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
  getAIModels,
  getThreads,
  getMessageHistory,
  createBridges,
  getAllBridges,
  getBridges,
  updateBridges,
  bridgeArchive,
  deleteBridges,
  getAndUpdate,
  updateBridgeType,
  getSystemPromptHistory,
  getAllSystemPromptHistory,
  FineTuneData,
  updateThreadMessage,
  updateMessageStatus
};