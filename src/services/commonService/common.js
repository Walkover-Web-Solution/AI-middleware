import { services } from "../../configs/models.js";
import ModelsConfig from "../../configs/modelConfiguration.js";
import { getThread } from "../../controllers/conversationContoller.js";
import { getConfiguration } from "../utils/getConfiguration.js";
import _ from "lodash";
import metrics_sevice from "../../db_services/metrics_services.js";
import { v1 as uuidv1 } from 'uuid';
import { UnifiedOpenAICase } from '../openAI/openaiCall.js';
import { ResponseSender } from "../utils/customRes.js";
import GeminiHandler from "../Google/geminiCall.js";
import Helper from "../utils/helper.js";
import responsePrompt from "../../../config/prompt.js";

const responseSender = new ResponseSender();

const getchat = async (req, res) => {
  try {
    let { apikey, configuration, service, variables = {} } = req.body;
    let customConfig = {};
    const bridge_id = req.params.bridge_id;
    const getconfig = await getConfiguration(configuration, service, bridge_id, apikey);
    if (!getconfig.success) {
      return res.status(400).json({
        success: false,
        error: getconfig.error
      });
    }
    configuration = getconfig.configuration;
    service = getconfig.service;
    apikey = getconfig.apikey;
    const model = configuration?.model;
    const bridge = getconfig.bridge;
    service = service ? service.toLowerCase() : "";

    if (!(service in services && services[service]["chat"].has(model))) {
      return res.status(400).json({
        success: false,
        error: "model or service does not exist!"
      });
    }
    const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
    const modelfunc = ModelsConfig[modelname];
    let {
      configuration: modelConfig,
      outputConfig: modelOutputConfig
    } = modelfunc();
    for (const key in modelConfig) {
      if (modelConfig[key]["level"] == 2 || key in configuration) {
        customConfig[key] = key in configuration ? configuration[key] : modelConfig[key]["default"];
      }
    } 
    let params = {
      customConfig,
      configuration,
      apikey,
      variables,
      user: configuration?.user || "",
      startTime: Date.now(),
      org_id: null,
      bridge_id: req.params.bridge_id || null,
      bridge: bridge || null,
      model,
      service,
      modelOutputConfig,
      playground: true,
      req
    };

    let result;
    switch (service) {
      case "openai":
        const openAIInstance = new UnifiedOpenAICase(params);
        result = await openAIInstance.execute();
        if (!result?.success) {
          return res.status(400).json(result);
        }
        break;
      case "google":
        const geminiHandler = new GeminiHandler(params);
        result = await geminiHandler.handleGemini();
        if (!result?.success) {
          return res.status(400).json(result);
        }
        break;
    }
    return res.status(200).json({
      success: true,
      response: result.modelResponse
    });
  } catch (error) {
    console.error("common error=>", error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
const prochat = async (req, res) => {
  const startTime = Date.now();
  
  let {
    apikey,
    bridge_id = null,
    configuration,
    thread_id = null,
    org_id = null,
    user = null,
    tool_call = null,
    service,
    variables = {},
    RTLayer = null,
    template_id=null,
  } = req.body;
  const bridgeType = req.chatbot 
  let usage = {},
    customConfig = {};
  let model = configuration?.model;
  let rtlLayer = false;
  let webhook, headers;
  try {
    const getconfig = await getConfiguration(configuration, service, bridge_id, apikey,template_id);
    if (!getconfig.success) {
      return res.status(400).json({
        success: false,
        error: getconfig.error
      });
    }
    configuration = getconfig.configuration;
    service = getconfig.service;
    apikey = getconfig.apikey;
    let template = getconfig.template;
    model = configuration?.model;
    rtlLayer = RTLayer != null ? RTLayer : getconfig.RTLayer;
    const bridge = getconfig.bridge;

    if (!(service in services && services[service]["chat"].has(model))) {
      return res.status(400).json({
        success: false,
        error: "model or service does not exist!"
      });
    }

    webhook = configuration?.webhook;
    headers = configuration?.headers;
    if (rtlLayer || webhook) {
      res.status(200).json({
        success: true,
        message: "Will got response over your configured means."
      });
    }

    const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
    const modelfunc = ModelsConfig[modelname];
    let { configuration: modelConfig, outputConfig: modelOutputConfig } = modelfunc();

    for (const key in modelConfig) {
      if (modelConfig[key]["level"] == 2 || key in configuration) {
        customConfig[key] = key in configuration ? configuration[key] : modelConfig[key]["default"];
      }
    }
    if (thread_id) {
      const result = await getThread(thread_id, org_id, bridge_id);
      if (result.success) {
        configuration["conversation"] = result?.data ? result.data : [];
      }
    } else {
      thread_id = uuidv1();
    }

    let params = {
      customConfig,
      configuration,
      apikey,
      variables,
      user,
      tool_call,
      startTime,
      org_id,
      bridge_id,
      bridge,
      thread_id,
      model,
      service,
      req,
      modelOutputConfig,
      playground: false,
      metrics_sevice,
      rtlayer: rtlLayer,
      webhook,
      template
    };

    let result;
    switch (service) {
      case "openai":
        const openAIInstance = new UnifiedOpenAICase(params);
        result = await openAIInstance.execute();
        if(!result?.success){
          if(rtlLayer || webhook){
            return
          }
          return res.status(400).json(result);
        }
        break;
      case "google":
        const geminiHandler = new GeminiHandler(params);
        result = await geminiHandler.handleGemini();
        
        if (!result?.success) {
          if(rtlLayer || webhook){
            return
          }
          return res.status(400).json(result);
        }
        break;
    }
    /// chat bot second reponse check
    if (bridgeType) {
      const parsedJson = Helper.parseJson(_.get(result.modelResponse, modelOutputConfig.message));
      if (!( parsedJson?.json?.isMarkdown)) {
        params.configuration.prompt = { "role": "system", content: responsePrompt };
        params.user = _.get(result.modelResponse, modelOutputConfig.message)
        params.template = null;
        const openAIInstance = new UnifiedOpenAICase(params);
        let newresult = await openAIInstance.execute();
        if (!newresult?.success) {
          return
        }

        _.set(result.modelResponse, modelOutputConfig.message, _.get(newresult.modelResponse, modelOutputConfig.message));
        _.set(result.modelResponse, modelOutputConfig.usage[0].total_tokens, _.get(result.modelResponse, modelOutputConfig.usage[0].total_tokens) + _.get(newresult.modelResponse, modelOutputConfig.usage[0].total_tokens));
        _.set(result.modelResponse, modelOutputConfig.usage[0].prompt_tokens, _.get(result.modelResponse, modelOutputConfig.usage[0].prompt_tokens) + _.get(newresult.modelResponse, modelOutputConfig.usage[0].prompt_tokens));
        _.set(result.modelResponse, modelOutputConfig.usage[0].completion_tokens, _.get(result.modelResponse, modelOutputConfig.usage[0].completion_tokens) + _.get(newresult.modelResponse, modelOutputConfig.usage[0].completion_tokens));
        result.historyParams = newresult.historyParams
        _.set(result.usage, "totalTokens", _.get(result.usage, "totalTokens") + _.get(newresult.usage, "totalTokens"));
        _.set(result.usage, "inputTokens", _.get(result.usage, "inputTokens") + _.get(newresult.usage, "inputTokens"));
        _.set(result.usage, "outputTokens", _.get(result.usage, "outputTokens") + _.get(newresult.usage, "outputTokens"));
        _.set(result.usage, "expectedCost", _.get(result.usage, "expectedCost") + _.get(newresult.usage, "expectedCost"));
        result.historyParams.user = user

      }

    }

    // -==-=-=-=-=-

    const endTime = Date.now();
    usage = {
      ...result?.usage,
      service: service,
      model: model,
      orgId: org_id,
      latency: endTime - startTime,
      success: true,
      variables: variables,
      prompt: configuration.prompt
    };
    metrics_sevice.create([usage], result.historyParams);
    responseSender.sendResponse({
      rtlLayer,
      webhook,
      data: { response: result.modelResponse, success: true },
      reqBody: req.body,
      headers: headers || {}
    });
    if(rtlLayer || webhook){
      return
    }
    return res.status(200).json({
    success: true,
    response: result.modelResponse
  });
  } catch (error) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    usage = {
      ...usage,
      service: service,
      model: model,
      orgId: org_id,
      latency: latency,
      success: false,
      error: error.message
    };
    metrics_sevice.create([usage]);
    console.error("prochats common error=>", error);
    responseSender.sendResponse({
      rtlLayer,
      webhook,
      data:  { error: error?.message, success: false },
      reqBody: req.body,
      headers: headers || {}
    });
    if(rtlLayer || webhook){
      return
    }
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getCompletion = async (req, res) => {
  try {
    let {
      apikey,
      configuration,
      service,
      playground = true,
      prompt
    } = req.body;
    const model = configuration?.model;
    let customConfig = {};
    service = service ? service.toLowerCase() : "";
    if (!(service in services && services[service]["completion"].has(model))) {
      return res.status(400).json({
        success: false,
        error: "model or service does not exist!"
      });
    }
    const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
    const modelfunc = ModelsConfig[modelname];
    let {
      configuration: modelConfig,
      // outputConfig: modelOutputConfig
    } = modelfunc();
    for (const key in modelConfig) {
      if (modelConfig[key]["level"] == 2 || key in configuration) {
        customConfig[key] = key in configuration ? configuration[key] : modelConfig[key]["default"];
      }
    }
    let result;
    const params = {
      configuration,
      apikey,
      service,
      startTime: Date.now(),
      modelOutputConfig: modelConfig,
      reqBody: req.body,
      headers: {},
      res,
      rtlLayer: false,
      webhook: false,
      playground,
      prompt,
      customConfig
    };
    switch (service) {
      case "openai":
        const openAIInstance = new UnifiedOpenAICase(params);
        result =  await openAIInstance.handleCompletion();
        break;
      case "google":
        const handler = new GeminiHandler(params);
        result =  await handler.handleCompletion();
        break;
    }
    return res.status(200).json({
      success: true,
      response: result.modelResponse
    });
  } catch (error) {
    console.error("Get Completion common error=>", error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
const proCompletion = async (req, res) => {
  const startTime = Date.now();
  let thread_id=uuidv1()
  let {
    apikey,
    bridge_id,
    configuration,
    org_id,
    prompt,
    service,
    variables,
    playground = false
  } = req.body;
  let webhook, headers;
  let model = configuration?.model;
  let usage = {},customConfig = {};
  let rtlLayer = false;
  try {
    const getconfig = await getConfiguration(configuration, service, bridge_id, apikey);
    if (!getconfig.success) {
      return res.status(400).json({
        success: false,
        error: getconfig.error
      });
    }
    configuration = getconfig.configuration;
    service = getconfig.service;
    apikey = getconfig.apikey;
    model = configuration?.model;
    rtlLayer = getconfig.RTLayer;
    if (!(service in services && services[service]["completion"].has(model))) {
      return res.status(400).json({
        success: false,
        error: "model or service does not exist!"
      });
    }
    webhook = configuration.webhook;
    headers = configuration.headers || {};
    if (rtlLayer || webhook) {
      res.status(200).json({
        success: true,
        message: "Will got reponse over your configured means."
      });
    }
    const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
    const modelfunc = ModelsConfig[modelname];
    let {
      configuration: modelConfig,
      outputConfig: modelOutputConfig
    } = modelfunc();
    for (const key in modelConfig) {
      if (modelConfig[key]["level"] == 2 || key in configuration) {
        customConfig[key] = key in configuration ? configuration[key] : modelConfig[key]["default"];
      }
    }
    let result;
    const params = {
      configuration,
      apikey,
      service,
      startTime,
      modelOutputConfig,
      reqBody: req.body,
      headers,
      res,
      rtlLayer,
      webhook,
      playground,
      prompt,
      customConfig,
      variables
    };
    switch (service) {
      case "openai":
        const openAIInstance = new UnifiedOpenAICase(params);
        result =  await openAIInstance.handleCompletion();
        break;
      case "google":
        const handler = new GeminiHandler(params);
        result =  await handler.handleCompletion();
        break;
    }

    const endTime = Date.now();
    
    usage = {
      ...result?.usage,
      service: service,
      model: model,
      orgId: org_id,
      latency: endTime - startTime,
      success: true,
      variables: variables
    };
    metrics_sevice.create([usage], result.historyParams);
    responseSender.sendResponse({
      rtlLayer,
      webhook,
      data:  { response: result.modelResponse, success: true },
      reqBody: req.body,
      headers: headers || {}
    });
    if(rtlLayer || webhook){
      return
    }
    return res.status(200).json({
      success: true,
      response: result.modelResponse
    });
  } catch (error) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    usage = {
      ...usage,
      service: service,
      model: model,
      orgId: org_id,
      latency: latency,
      success: false,
      error: error.message
    };
    metrics_sevice.create([usage],{
      thread_id: thread_id,
      user: prompt,
      message: "",
      org_id: org_id,
      bridge_id: bridge_id,
      model: configuration?.model,
      channel: 'completion',
      type: "error",
      actor:  "user"
    });
    console.error("proCompletion common error=>", error);
    responseSender.sendResponse({
      rtlLayer,
      webhook,
      data: {  error: error?.message, success: false},
      reqBody: req.body,
      headers: headers || {}
    });
    if(rtlLayer || webhook){
      return
    }
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
const getEmbeddings = async (req, res) => {
  try {
    let {
      apikey,
      configuration,
      service
    } = req.body;
    const model = configuration?.model;
    let  customConfig = {};
    service = service ? service.toLowerCase() : "";
    if (!(service in services && services[service]["embedding"].has(model))) {
      return res.status(400).json({
        success: false,
        error: "model or service does not exist!"
      });
    }
    const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
    const modelfunc = ModelsConfig[modelname];
    let {
      configuration: modelConfig,
      // outputConfig: modelOutputConfig
    } = modelfunc();
    for (const key in modelConfig) {
      if (modelConfig[key]["level"] == 2 || key in configuration) {
        customConfig[key] = key in configuration ? configuration[key] : modelConfig[key]["default"];
      }
    }
    let params = {
      customConfig,
      configuration,
      apikey,
      startTime: Date.now(),
      org_id: null,
      bridge_id: req.params.bridge_id || null,
      model,
      service,
      playground: true,

    };
    let result;
    switch (service) {
      case "openai":
        const openAIInstance = new UnifiedOpenAICase(params);
        result = await openAIInstance.handleEmbedding();
        if (!result?.success) {
          return res.status(400).json(result);
        }
        break;
      case "google":
        const geminiHandler = new GeminiHandler(params);
        result = await geminiHandler.handleGemini();
        
        if (!result?.success) {
          return res.status(400).json(result);
      }
  }
    return res.status(200).json({
      success: true,
      response: result.modelResponse
    });
  } catch (error) {
    console.error("proCompletion common error=>", error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
const proEmbeddings = async (req, res) => {
  const startTime = Date.now();
  let thread_id = uuidv1();
  let {
    apikey,
    bridge_id,
    configuration,
    org_id,
    input,
    service
  } = req.body;
  let webhook, headers;
  let model = configuration?.model;
  let usage = {},
    customConfig = {};
  let rtlLayer = false;
  try {
    const getconfig = await getConfiguration(configuration, service, bridge_id, apikey);
    if (!getconfig.success) {
      return res.status(400).json({
        success: false,
        error: getconfig.error
      });
    }
    configuration = getconfig.configuration;
    service = getconfig.service;
    apikey = getconfig.apikey;
    rtlLayer = getconfig.RTLayer;
    model = configuration?.model;
    if (!(service in services && services[service]["embedding"].has(model))) {
      return res.status(400).json({
        success: false,
        error: "model or service does not exist!"
      });
    }
    webhook = configuration.webhook;
    headers = configuration.headers || {};
    if (rtlLayer || webhook) {
      res.status(200).json({
        success: true,
        message: "Will got reponse over your configured means."
      });
    }
    const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
    const modelfunc = ModelsConfig[modelname];
    let {
      configuration: modelConfig,
      outputConfig: modelOutputConfig
    } = modelfunc();
    for (const key in modelConfig) {
      if (modelConfig[key]["level"] == 2 || key in configuration) {
        customConfig[key] = key in configuration ? configuration[key] : modelConfig[key]["default"];
      }
    }
    let result;
    let params = {
      customConfig,
      configuration,
      apikey,
      startTime: Date.now(),
      org_id: null,
      bridge_id: req.params.bridge_id || null,
      model,
      service,
      modelOutputConfig,
      playground: false,
      input,
      thread_id
    };
    switch (service) {
      case "openai":
        const openAIInstance = new UnifiedOpenAICase(params);
        result = await openAIInstance.handleEmbedding();
        if (!result?.success) {
          if(rtlLayer || webhook){
            return
          }
          return res.status(400).json(result);
        }
        break;
      case "google":
        const geminiHandler = new GeminiHandler(params);
        result = await geminiHandler.handleEmbedding();
        
        if (!result?.success) {
          if(rtlLayer || webhook){
            return
          }
          return res.status(400).json(result);
        }
        break;
    }
    const endTime = Date.now();
    usage = {
      ...result?.usage,
      service: service,
      model: model,
      orgId: org_id,
      latency: endTime - startTime,
      success: true
    };
    metrics_sevice.create([usage], result.historyParams);
    responseSender.sendResponse({
      rtlLayer,
      webhook,
      data:   { response: result.modelResponse, success: true},
      reqBody: req.body,
      headers: headers || {}
    });
    if(rtlLayer || webhook){
      return
    }
    return res.status(200).json({
      success: true,
      response: result.modelResponse
    });
  } catch (error) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    usage = {
      ...usage,
      service: service,
      model: model,
      orgId: org_id,
      latency: latency,
      success: false,
      error: error.message
    };
    metrics_sevice.create([usage],{
      thread_id: thread_id,
      user: input,
      message: "",
      org_id: org_id,
      bridge_id: bridge_id,
      model: configuration?.model,
      channel: 'embedding',
      type: "error",
      actor: "user"
    });
    console.error("proembeddings common error=>", error);
    responseSender.sendResponse({
      rtlLayer,
      webhook,
      data:  { error: error?.message, success: false},
      reqBody: req.body,
      headers: headers || {}
    });
    if(rtlLayer || webhook){
      return
    }
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
export default {
  getchat,
  prochat,
  getCompletion,
  proCompletion,
  getEmbeddings,
  proEmbeddings
};