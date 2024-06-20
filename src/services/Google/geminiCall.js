import { runChat } from "./gemini.js";
import conversationService from "../commonService/createConversation.js";
import _ from "lodash";
import metrics_service from "../../db_services/metrics_services.js";
import { ResponseSender } from "../utils/customRes.js";

class GeminiHandler {
  constructor(params) {
    this.customConfig = params.customConfig;
    this.configuration = params.configuration;
    this.apikey = params.apikey;
    this.user = params.user;
    this.startTime = params.startTime;
    this.org_id = params.org_id;
    this.bridge_id = params.bridge_id;
    this.thread_id = params.thread_id;
    this.model = params.model;
    this.service = params.service;
    this.rtlayer = params.rtlayer;
    this.modelOutputConfig = params.modelOutputConfig;
    this.webhook = params.webhook;
    this.headers = params.headers;
    this.playground = params.playground;
    this.req = params.req;
    this.responseSender = new ResponseSender();
    this.input = params.input;
  }
 
  async handleGemini() {
    let usage = {};
    let historyParams = {};

    let geminiConfig = {
      generationConfig: this.customConfig,
      model: this.configuration?.model,
      user_input: this.user,
    };
    geminiConfig["history"] = this.configuration?.conversation
      ? conversationService.createGeminiConversation(this.configuration.conversation).messages
      : [];
  const geminiResponse = await runChat(geminiConfig, this.apikey, "chat");
   let  modelResponse = _.get(geminiResponse, "modelResponse", {});
    if (!geminiResponse?.success) {
      usage = {
        service: this.service,
        model: this.model,
        orgId: this.org_id,
        latency: Date.now() - this.startTime,
        success: false,
        error: geminiResponse?.error,
      };
      if (!this.playground) {
        metrics_service.create([usage], {
          thread_id: this.thread_id,
          user: this.user,
          message: "",
          org_id: this.org_id,
          bridge_id: this.bridge_id,
          model: this.configuration?.model,
          channel: 'chat',
          type: "error",
          actor: "user",
        });
        this.responseSender.sendResponse({
          rtlayer: this.rtlayer,
          webhook: this.webhook,
          data: { success: false, error: geminiResponse?.error },
          reqBody: this.req.body,
          headers: this.headers || {},
        });
      }
      return { success: false, error: geminiResponse?.error };
    }
    if(!this.playground) {

    usage["totalTokens"] = _.get(geminiResponse, this.modelOutputConfig.usage[0].total_tokens);
    usage["inputTokens"] = _.get(geminiResponse, this.modelOutputConfig.usage[0].prompt_tokens);
    usage["outputTokens"] = _.get(geminiResponse, this.modelOutputConfig.usage[0].output_tokens);
    usage["expectedCost"] = this.modelOutputConfig.usage[0].total_cost;

    historyParams = {
      thread_id: this.thread_id,
      user: this.user,
      message: _.get(modelResponse, this.modelOutputConfig.message),
      org_id: this.org_id,
      bridge_id: this.bridge_id,
      model: this.configuration?.model,
      channel: 'chat',
      type: "model",
      actor: "user",
    };
  }

    return {
      success: true,
      modelResponse,
      usage,
      historyParams,
    };
  }
  async handleCompletion() {
      let usage = {};
      let historyParams = {};
      const geminiConfig = {
        prompt: (this.configuration?.prompt || "") + "\n" + this.reqBody?.prompt || "",
        model: this.configuration?.model
      };
      const geminiResponse = await runChat(geminiConfig, this.apikey, "completion");
      const modelResponse = _.get(geminiResponse, "modelResponse", {});
     
      if (!geminiResponse?.success) {
        
        if(!this.playground){
        usage = {
          service: this.service,
          model: this.config.model,
          orgId: this.reqBody.org_id,
          latency: Date.now() - this.startTime,
          success: false,
          error: geminiResponse?.error
        };
        metrics_service.create([usage],{
          thread_id: this.thread_id,
          user: this.configuration?.prompt,
          message: "",
          org_id: this.org_id,
          bridge_id: this.bridge_id,
          model: this.configuration?.model,
          channel: 'completion',
          type: "error",
          actor:  "user"
        });
        this.responseSender.sendResponse({
          rtlLayer: this.rtlLayer,
          webhook: this.webhook,
          data: { error: geminiResponse?.error, success: false },
          reqBody: this.reqBody,
          headers: this.headers || {}
        });
        return this.res.status(400).json({
          success: false,
          error: geminiResponse?.error
        });
      }
    }
    if(!this.playground){
      usage["totalTokens"] = _.get(geminiResponse, this.modelOutputConfig.usage[0].total_tokens);
      usage["inputTokens"] = _.get(geminiResponse, this.modelOutputConfig.usage[0].prompt_tokens);
      usage["outputTokens"] = _.get(geminiResponse, this.modelOutputConfig.usage[0].output_tokens);
      usage["expectedCost"] = this.modelOutputConfig.usage[0].total_cost;
      historyParams = {
        thread_id: this.thread_id,
        user: this.configuration.prompt,
        message: _.get(modelResponse, this.modelOutputConfig.message),
        org_id: this.org_id,
        bridge_id: this.bridge_id,
        model: this.configuration?.model,
        channel: 'completion',
        type: "model",
        actor: "user",
      };
    }
        return{
          success: true,
          modelResponse,
          usage,
          historyParams
        }
      }
  async handleEmbedding(){
    let usage = {};
    let historyParams = {};
    let geminiConfig = {
      input: this.input || "",
      model: this.configuration?.model
    };
    const geminiResponse = await runChat(geminiConfig, this.apikey, "embedding");
    let modelResponse = _.get(geminiResponse, "modelResponse", {});
    if (!geminiResponse?.success) {
      if(!this.playground){
      usage = {
        service: this.service,
        model: this.model,
        orgId: this.org_id,
        latency: Date.now() - this.startTime,
        success: false,
        error: geminiResponse?.error
      };
      metrics_service.create([usage],{
        thread_id: this.thread_id,
        user: this.input,
        message: "",
        org_id: this.org_id,
        bridge_id: this.bridge_id,
        model: this.configuration?.model,
        channel: 'embedding',
        type: "error",
        actor: "user"
      });
      this.responseSender.sendResponse({
        rtlayer: this.rtlayer,
        webhook: this.webhook,
        data: { error: geminiResponse?.error, success: false },
        reqBody: this.req.body,
        headers: this.headers || {}
      });
    }
      return { success: false, error: geminiResponse?.error };
    }
    if(!this.playground) {

    usage["totalTokens"] = _.get(geminiResponse, this.modelOutputConfig.usage[0].total_tokens);
    usage["inputTokens"] = _.get(geminiResponse, this.modelOutputConfig.usage[0].prompt_tokens);
    usage["outputTokens"] = _.get(geminiResponse, this.modelOutputConfig.usage[0].output_tokens);
    usage["expectedCost"] = this.modelOutputConfig.usage[0].total_cost;

    historyParams = {
      thread_id: this.thread_id,
      user: this.input,
      message: _.get(modelResponse, this.modelOutputConfig.message) == null ? _.get(modelResponse, this.modelOutputConfig.tools) : _.get(modelResponse, this.modelOutputConfig.message),
      org_id: this.org_id,
      bridge_id: this.bridge_id || null,
      model: this.configuration?.model,
      channel: 'embedding',
      type: _.get(modelResponse, this.modelOutputConfig.message) == null ? "embedding" : "assistant",
      actor: this.input ? "user" : "tool"
    }
  }
    return {
      success: true,
      modelResponse,
      usage,
      historyParams,
    };
  }
}

export default GeminiHandler;
