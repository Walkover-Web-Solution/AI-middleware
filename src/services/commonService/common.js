import { services } from "../../../config/models.js";
import ModelsConfig from "../../configs/modelConfiguration.js";
import { getThread } from "../../controllers/conversationContoller.js";
import conversationService from "./createConversation.js";
import { sendRequest } from "../utils/request.js";
import { getConfiguration } from "../utils/getConfiguration.js";
import _ from "lodash";
import { completion } from "../openAI/completion.js";
import { embeddings } from "../openAI/embedding.js";
import { runChat } from "../Google/gemini.js";
import metrics_sevice from "../../db_services/metrics_services.js";
import RTLayer from 'rtlayer-node';
import {v1 as uuidv1} from 'uuid';
import  {UnifiedOpenAICase}  from '../openAI/openaiCall.js';

const rtlayer = new RTLayer.default(process.env.RTLAYER_AUTH)

const getchat = async (req, res) => {
  try {
    let { apikey, configuration, service, variables = {}, bridge_id } = req.body;
    // let usage,
    let customConfig = {};

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
    }  //Make it modular
    let params = {
      customConfig,
      configuration,
      apikey,
      variables,
      user: configuration?.user?.content || "",
      startTime: Date.now(),
      org_id: null,
      bridge_id: req.body.bridge_id || null,
      bridge: bridge || null,
      model,
      service,
      modelOutputConfig,
      playground: true,
    };
    console.log(555,params);

    let result;
    switch (service) {
      case "openai":
        // result = await unifiedOpenAICase(params);
       console.log(555,params);
        const openAIInstance = new UnifiedOpenAICase(params);
        result = await openAIInstance.execute();
        break;
      case "google":
        let geminiConfig = {
          generationConfig: customConfig,
          model: configuration?.model,
          user_input: configuration?.user
        };
        const geminiResponse = await runChat(geminiConfig, apikey, "chat");
        // modelResponse = _.get(geminiResponse, "modelResponse", {});
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
      response: result.modelResponse
    });
  } catch (error) {
    console.log("common error=>", error);
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
    RTLayer = null
  } = req.body;

  let usage = {},
    modelResponse = {},
    customConfig = {};
  let model = configuration?.model;
  let rtlLayer = false;
  let webhook, headers;
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
    rtlLayer = RTLayer != null ? RTLayer : getconfig.RTLayer;
    const bridge = getconfig.bridge;
    const apiCallavailable = bridge?.is_api_call ?? false;

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
      rtlLayer,
      req,
      modelOutputConfig,
      playground: false,
      metrics_sevice,
      rtlayer: rtlLayer,
      webhook
    };

    let result;
    
    switch (service) {
      case "openai":
        const openAIInstance = new UnifiedOpenAICase(params);
        result = await openAIInstance.execute();
        break;
      case "google":
        let geminiConfig = {
          generationConfig: customConfig,
          model: configuration?.model,
          user_input: user
        };
        geminiConfig["history"] = configuration?.conversation ? conversationService.createGeminiConversation(configuration.conversation).messages : [];
        const geminiResponse = await runChat(geminiConfig, apikey, "chat");
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
          if (rtlLayer && !playground) {
            rtlayer.message({
              ...req.body,
              error: geminiResponse?.error,
              success: false
            }, req.body.rtlOptions).then(data => {
              console.log("message sent", data);
            }).catch(error => {
              console.log("message not sent", error);
            });
            return;
          }
          if (webhook && !playground) {
            await sendRequest(webhook, {
              error: geminiResponse?.error,
              success: false,
              ...req.body
            }, 'POST', headers);
            return;
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
        // historyParams = {
        //   thread_id: thread_id,
        //   user: user,
        //   message: _.get(modelResponse, modelOutputConfig.message),
        //   org_id: org_id,
        //   bridge_id: bridge_id,
        //   model: configuration?.model,
        //   channel: 'chat',
        //   type: "model",
        //   actor: "user"
        // };
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
      variables: variables,
      prompt: configuration.prompt
    };
    metrics_sevice.create([usage], result.historyParams);
    if (webhook && !playground) {
      await sendRequest(webhook, {
        success: true,
        response: result.modelResponse,
        ...req.body
      }, 'POST', headers);
      return;
    }
    if (rtlLayer && !playground) {
      rtlayer.message({
        ...req.body,
        function_call: false,
        response: modelResponse,
        success: true
      }, req.body.rtlOptions).then(data => {
        console.log("message sent", data);
      }).catch(error => {
        console.log("message not sent", error);
      });
      return;
    }
    return res.status(200).json({
      success: true,
      response: result.modelResponse
    });
  } catch (error) {
    console.log(error, 12345);
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
    metrics_sevice.create([usage], {});
    console.log("prochats common error=>", error);
    if (rtlLayer) {
      rtlayer.message({
        ...req.body,
        error: error?.message,
        success: false
      }, req.body.rtlOptions).then(data => {
        console.log("message sent", data);
      }).catch(error => {
        console.log("message not sent", error);
      });
      return;
    }
    if (webhook) {
      await sendRequest(webhook, {
        error: error?.message,
        success: false,
        ...req.body
      }, 'POST', headers);
      return;
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
        // console.log(customConfig);
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
    console.log("Get Completion common error=>", error);
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
        // console.log(customConfig);
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
          if (rtlLayer) {
            rtlayer.message({
              ...req.body,
              error: openAIResponse?.error,
              success: false
            }, req.body.rtlOptions);
            return;
          }
          if (webhook) {
            await sendRequest(webhook, {
              error: openAIResponse?.error,
              success: false,
              ...req.body
            }, 'POST', headers);
            return;
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
          if (rtlLayer) {
            rtlayer.message({
              ...req.body,
              error: geminiResponse?.error,
              success: false
            }, req.body.rtlOptions);
            return;
          }
          if (webhook) {
            await sendRequest(webhook, {
              error: geminiResponse?.error,
              success: false,
              ...req.body
            }, 'POST', headers);
            return;
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
    metrics_sevice.create([usage],historyParams);
    if (webhook) {
      await sendRequest(webhook, {
        success: true,
        response: modelResponse,
        ...req.body
      }, 'POST', headers);
      return;
    }
    if (rtlLayer) {
      rtlayer.message({
        ...req.body,
        response: modelResponse,
        success: true
      }, req.body.rtlOptions);
      return;
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
    console.log("proCompletion common error=>", error);
    if (rtlLayer) {
      rtlayer.message({
        ...req.body,
        error: error?.message,
        success: false
      }, req.body.rtlOptions);
      return;
    }
    if (webhook) {
      await sendRequest(webhook, {
        error: error?.message,
        success: false,
        ...req.body
      }, 'POST', headers);
      return;
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
    console.log("proCompletion common error=>", error);
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
          if (rtlLayer) {
            rtlayer.message({
              ...req.body,
              error: response?.error,
              success: false
            }, req.body.rtlOptions);
            return;
          }
          if (webhook) {
            await sendRequest(webhook, {
              error: response?.error,
              success: false,
              ...req.body
            }, 'POST', headers);
            return;
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
          if (rtlLayer) {
            rtlayer.message({
              ...req.body,
              error: geminiResponse?.error,
              success: false
            }, req.body.rtlOptions);
            return;
          }
          if (webhook) {
            await sendRequest(webhook, {
              error: geminiResponse?.error,
              success: false,
              ...req.body
            }, 'POST', headers);
            return;
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
    metrics_sevice.create([usage],historyParams);
    if (webhook) {
      await sendRequest(webhook, {
        success: true,
        response: modelResponse,
        ...req.body
      }, 'POST', headers);
      return;
    }
    if (rtlLayer) {
      rtlayer.message({
        ...req.body,
        response: modelResponse,
        success: false
      }, req.body.rtlOptions);
      return;
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
    console.log("proembeddings common error=>", error);
    if (rtlLayer) {
      rtlayer.message({
        ...req.body,
        error: error.message,
        success: false
      }, req.body.rtlOptions);
      return;
    }
    if (webhook) {
      await sendRequest(webhook, {
        error: error?.message,
        success: false,
        ...req.body
      }, 'POST', headers);
      return;
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