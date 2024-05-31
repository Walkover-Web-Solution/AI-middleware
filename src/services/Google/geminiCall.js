import { runChat } from "./gemini.js";
import conversationService from "../commonService/createConversation.js";
import _ from "lodash";
import metrics_service from "../../db_services/metrics_services.js";
import { ResponseSender } from "../utils/customRes.js";

class GeminiHandler {
  constructor() {
    this.responseSender = new ResponseSender();
  }

  async handleGemini(params, req, res) {
    let {
      customConfig,
      configuration,
      apikey,
      user,
      startTime,
      org_id,
      bridge_id,
      thread_id,
      model,
      service,
      rtlayer,
      modelOutputConfig,
      webhook,
      headers,
      playground
    } = params;
  
    let usage = {};
    let modelResponse = {};
  
    let geminiConfig = {
      generationConfig: customConfig,
      model: configuration?.model,
      user_input: user
    };
    
    geminiConfig["history"] = configuration?.conversation 
      ? conversationService.createGeminiConversation(configuration.conversation).messages 
      : [];
    
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
      if(!playground) {
      metrics_service.create([usage], {
        thread_id: thread_id,
        user: user,
        message: "",
        org_id: org_id,
        bridge_id: bridge_id,
        model: configuration?.model,
        channel: 'chat',
        type: "error",
        actor: "user"
      });
      this.responseSender.sendResponse({
        rtlayer,
        webhook,
        data: { success: false, error: geminiResponse?.error },
        reqBody: req.body,
        headers: headers || {}
      });
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
    
    let historyParams = {
      thread_id: thread_id,
      user: user,
      message: _.get(modelResponse, modelOutputConfig.message),
      org_id: org_id,
      bridge_id: bridge_id,
      model: configuration?.model,
      channel: 'chat',
      type: "model",
      actor: "user"
    };
    
    return {
      success: true,
      modelResponse,
      usage,
      historyParams
    };
  }
}

export default GeminiHandler;
