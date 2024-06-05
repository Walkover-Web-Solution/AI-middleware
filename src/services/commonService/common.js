import { services } from "../../configs/models.js";
import ModelsConfig from "../../configs/modelConfiguration.js";
import { getThread } from "../../controllers/conversationContoller.js";
import { getConfiguration } from "../utils/getConfiguration.js";
import _ from "lodash";
import { completion } from "../openAI/completion.js";
import { embeddings } from "../openAI/embedding.js";
import { runChat } from "../Google/gemini.js";
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
      user: configuration?.user?.content || "",
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
        params.user = configuration?.user;
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
    bridgeType="api"
  } = req.body;
  
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
    if(bridgeType==="chat"){
      const parsedJson=Helper.parseJson(_.get(result.modelResponse,modelOutputConfig.message));
        const bridgeMarkdown = parsedJson?.json?.bridgemarkdown ?? false;
        if(bridgeMarkdown){
          params.configuration.prompt = responsePrompt;
          const openAIInstance = new UnifiedOpenAICase(params);
          let newresult = await openAIInstance.execute();
          if(!newresult?.success){
              return
          }
          _.set(result.modelResponse, modelOutputConfig.message, _.get(newresult.modelResponse, modelOutputConfig.message));
          _.set(result.modelResponse, modelOutputConfig.usage[0].total_tokens, _.get(result.modelResponse, modelOutputConfig.usage[0].total_tokens) + _.get(newresult.modelResponse, modelOutputConfig.usage[0].total_tokens));
          _.set(result.modelResponse, modelOutputConfig.usage[0].prompt_tokens, _.get(result.modelResponse, modelOutputConfig.usage[0].prompt_tokens) + _.get(newresult.modelResponse, modelOutputConfig.usage[0].prompt_tokens));
          _.set(result.modelResponse, modelOutputConfig.usage[0].completion_tokens, _.get(result.modelResponse, modelOutputConfig.usage[0].completion_tokens) + _.get(newresult.modelResponse, modelOutputConfig.usage[0].completion_tokens));
          result.historyParams=newresult.historyParams
          _.set(result.usage,"totalTokens", _.get(result.usage, "totalTokens") + _.get(newresult.usage, "totalTokens"));
          _.set(result.usage, "inputTokens", _.get(result.usage, "inputTokens") + _.get(newresult.usage,  "inputTokens"));
          _.set(result.usage, "outputTokens", _.get(result.usage,  "outputTokens") + _.get(newresult.usage,  "outputTokens"));
          _.set(result.usage,"expectedCost", _.get(result.usage, "expectedCost") + _.get(newresult.usage, "expectedCost"));
          result.historyParams.user=user

        }

    }

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
      service
    } = req.body;
    const model = configuration?.model;
    // let usage,
    let modelResponse = {},
      customConfig = {};
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
    switch (service) {
      case "openai":
        customConfig["prompt"] = configuration?.prompt || "";
        const openAIResponse = await completion(customConfig, apikey);
        modelResponse = _.get(openAIResponse, "modelResponse", {});
        if (!openAIResponse?.success) {
          return res.status(400).json({
            success: false,
            error: openAIResponse?.error
          });
        }
        // usage = modelResponse[modelOutputConfig["usage"]];
        break;
      case "google":
        let geminiConfig = {
          prompt: configuration?.prompt || "",
          model: configuration?.model
        };
        const geminiResponse = await runChat(geminiConfig, apikey, "completion");
        modelResponse = _.get(geminiResponse, "modelResponse", {});
        if (!geminiResponse?.success) {
          return res.status(400).json({
            success: false,
            error: geminiResponse?.error
          });
        }
        break;
    }
    return res.status(200).json({
      success: true,
      response: modelResponse
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
    variables
  } = req.body;
  let webhook, headers;
  let model = configuration?.model;
  let usage = {},
    modelResponse = {},
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
    let historyParams;
    switch (service) {
      case "openai":
        configuration["prompt"] = configuration?.prompt ? configuration.prompt + "\n" + prompt : prompt;
        customConfig["prompt"] = configuration?.prompt || "";
        if (variables && Object.keys(variables).length > 0) {
          Object.entries(variables).forEach(([key, value]) => {
            const stringValue = JSON.stringify(value);
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            customConfig["prompt"] = customConfig.prompt.replace(regex, stringValue);
          });
        }
        const openAIResponse = await completion(customConfig, apikey);
        modelResponse = _.get(openAIResponse, "modelResponse", {});
        if (!openAIResponse?.success) {
          usage = {
            service: service,
            model: model,
            orgId: org_id,
            latency: Date.now() - startTime,
            success: false,
            error: openAIResponse?.error,
            variables: variables
          };
          metrics_sevice.create([usage], {
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
          responseSender.sendResponse({
            rtlLayer,
            webhook,
            data:  { error: openAIResponse?.error, success: false},
            reqBody: req.body,
            headers: headers || {}
          });
          if(rtlLayer || webhook){
            return
          }
          return res.status(400).json({
            success: false,
            error: openAIResponse?.error
          });
        }
        usage["totalTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].total_tokens);
        usage["inputTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].prompt_tokens);
        usage["outputTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].completion_tokens);
        usage["expectedCost"] = usage.inputTokens / 1000 * modelOutputConfig.usage[0].total_cost.input_cost + usage.outputTokens / 1000 * modelOutputConfig.usage[0].total_cost.output_cost;
        historyParams = {
          thread_id: thread_id,
          user: prompt,
          message: _.get(modelResponse, modelOutputConfig.message) == null ? _.get(modelResponse, modelOutputConfig.tools) : _.get(modelResponse, modelOutputConfig.message),
          org_id: org_id,
          bridge_id: bridge_id,
          model: configuration?.model,
          channel: 'completion',
          type: _.get(modelResponse, modelOutputConfig.message) == null ? "completion" : "assistant",
          actor:"user"
        }; 
        break;
      case "google":
        let geminiConfig = {
          prompt: (configuration?.prompt || "") + "\n" + prompt || "",
          model: configuration?.model
        };
        const geminiResponse = await runChat(geminiConfig, apikey, "completion");
        modelResponse = _.get(geminiResponse, "modelResponse", {});
        if (!geminiResponse?.success) {
          usage = {
            service: service,
            model: model,
            orgId: org_id,
            latency: Date.now() - startTime,
            success: false,
            error: geminiResponse?.error
          };
          metrics_sevice.create([usage]);
          responseSender.sendResponse({
            rtlLayer,
            webhook,
            data:  {error: geminiResponse?.error, success: false },
            reqBody: req.body,
            headers: headers || {}
          });
          if(rtlLayer || webhook){
            return
          }
          return res.status(400).json({
            success: false,
            error: geminiResponse?.error
          });
        }
        usage["totalTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].total_tokens);
        usage["inputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].prompt_tokens);
        usage["outputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].output_tokens);
        usage["expectedCost"] = modelOutputConfig.usage[0].total_cost;
        break;
    }
    const endTime = Date.now();
    usage = {
      ...usage,
      service: service,
      model: model,
      orgId: org_id,
      latency: endTime - startTime,
      success: true,
      variables: variables
    };
    metrics_sevice.create([usage], historyParams);
    responseSender.sendResponse({
      rtlLayer,
      webhook,
      data:  { response: modelResponse, success: true },
      reqBody: req.body,
      headers: headers || {}
    });
    if(rtlLayer || webhook){
      return
    }
    return res.status(200).json({
      success: true,
      response: modelResponse
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
    // let usage,
    let  modelResponse = {},
      customConfig = {};
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
    switch (service) {
      case "openai":
        customConfig["input"] = configuration?.input || "";
        const openAIResponse = await embeddings(customConfig, apikey);
        modelResponse = _.get(openAIResponse, "modelResponse", {});
        if (!openAIResponse?.success) {
          return res.status(400).json({
            success: false,
            error: openAIResponse?.error
          });
        }
        // usage = modelResponse[modelOutputConfig["usage"]];
        break;
      case "google":
        let geminiConfig = {
          input: configuration?.input || "",
          model: configuration?.model
        };
        const geminiResponse = await runChat(geminiConfig, apikey, "embedding");
        modelResponse = _.get(geminiResponse, "modelResponse", {});
        if (!geminiResponse?.success) {
          return res.status(400).json({
            success: false,
            error: geminiResponse?.error
          });
        }
        break;
    }
    return res.status(200).json({
      success: true,
      response: modelResponse
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
    modelResponse = {},
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
    let historyParams;
    switch (service) {
      case "openai":
        customConfig["input"] = input || "";
        const response = await embeddings(customConfig, apikey);
        modelResponse = _.get(response, "modelResponse", {});
        if (!response?.success) {
          usage = {
            service: service,
            model: model,
            orgId: org_id,
            latency: Date.now() - startTime,
            success: false,
            error: response?.error
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
          responseSender.sendResponse({
            rtlLayer,
            webhook,
            data:   { error: response?.error, success: false },
            reqBody: req.body,
            headers: headers || {}
          });
          if(rtlLayer || webhook){
            return
          }
          return res.status(400).json({
            success: false,
            error: response?.error
          });
        }
        usage["totalTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].total_tokens);
        usage["inputTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].prompt_tokens);
        usage["outputTokens"] = usage["totalTokens"] - usage["inputTokens"];
        usage["expectedCost"] = usage.totalTokens / 1000 * modelOutputConfig.usage[0].total_cost;
        historyParams = {
          thread_id: thread_id,
          user: input,
          message: _.get(modelResponse, modelOutputConfig.message) == null ? _.get(modelResponse, modelOutputConfig.tools) : _.get(modelResponse, modelOutputConfig.message),
          org_id: org_id,
          bridge_id: bridge_id || null,
          model: configuration?.model,
          channel: 'embedding',
          type: _.get(modelResponse, modelOutputConfig.message) == null ? "embedding" : "assistant",
          actor: input ? "user" : "tool"
        }
        break;
      case "google":
        let geminiConfig = {
          input: input || "",
          model: configuration?.model
        };
        const geminiResponse = await runChat(geminiConfig, apikey, "embedding");
        modelResponse = _.get(geminiResponse, "modelResponse", {});
        if (!geminiResponse?.success) {
          usage = {
            service: service,
            model: model,
            orgId: org_id,
            latency: Date.now() - startTime,
            success: false,
            error: geminiResponse?.error
          };
          metrics_sevice.create([usage]);
          responseSender.sendResponse({
            rtlLayer,
            webhook,
            data: { error: geminiResponse?.error, success: false },
            reqBody: req.body,
            headers: headers || {}
          });
          if(rtlLayer || webhook){
            return
          }
          return res.status(400).json({
            success: false,
            error: geminiResponse?.error
          });
        }
        usage["totalTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].total_tokens);
        usage["inputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].prompt_tokens);
        usage["outputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].output_tokens);
        usage["expectedCost"] = modelOutputConfig.usage[0].total_cost;
        break;
    }
    const endTime = Date.now();
    usage = {
      ...usage,
      service: service,
      model: model,
      orgId: org_id,
      latency: endTime - startTime,
      success: true
    };
    metrics_sevice.create([usage], historyParams);
    responseSender.sendResponse({
      rtlLayer,
      webhook,
      data:   { response: modelResponse, success: true},
      reqBody: req.body,
      headers: headers || {}
    });
    if(rtlLayer || webhook){
      return
    }
    return res.status(200).json({
      success: true,
      response: modelResponse
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