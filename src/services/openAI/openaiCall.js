// 

import { chats } from "./chat.js";
import conversationService from "../commonService/createConversation.js";
import _ from "lodash";
import functionCall from "./functionCall.js";
import Helper from "../utils/helper.js";
import { ResponseSender } from "../utils/customRes.js";
class UnifiedOpenAICase {
  constructor(params) {
    this.customConfig = params.customConfig;
    this.configuration = params.configuration;
    this.apikey = params.apikey;
    this.variables = params.variables;
    this.user = params.user;
    this.tool_call = params.tool_call;
    this.startTime = params.startTime;
    this.org_id = params.org_id;
    this.bridge_id = params.bridge_id;
    this.bridge = params.bridge;
    this.thread_id = params.thread_id;
    this.model = params.model;
    this.service = params.service;
    this.rtlLayer = params.rtlayer;
    this.req = params.req; 
    this.modelOutputConfig = params.modelOutputConfig;
    this.apiCallavailable =  params.bridge?.is_api_call ?? false;
    this.playground = params.playground;
    this.metrics_sevice = params.metrics_sevice;
    this.sendRequest = params.sendRequest;
    // rtlayer = params.rtlayer;
    this.RTLayer=params.RTLayer;
    this.webhook = params.webhook;
    this.headers = params.headers;
    this.responseSender = new ResponseSender(process.env.RTLAYER_AUTH);
  }

  async execute() {
    let historyParams = {};
    let usage;
    let prompt = this.configuration.prompt ?? [];
    prompt = Array.isArray(prompt) ? prompt : [prompt];
    const conversation = this.configuration?.conversation ? conversationService.createOpenAIConversation(this.configuration.conversation).messages : [];

    prompt = Helper.replaceVariablesInPrompt(prompt, this.variables);

    this.customConfig["messages"] = [...prompt, ...conversation, this.user ? { role: "user", content: this.user } : this.tool_call];
    const openAIResponse = await chats(this.customConfig, this.apikey);
    let modelResponse = _.get(openAIResponse, "modelResponse", {});

    if (!openAIResponse?.success) {
      if(!this.playground){
      usage = {
        service: this.service,
        model: this.model,
        orgId: this.org_id,
        latency: Date.now() - this.startTime,
        success: false,
        error: openAIResponse?.error
      };
      this.metrics_sevice.create([usage], {
        thread_id: this.thread_id,
        user: this.user ? this.user : JSON.stringify(this.tool_call),
        message: "",
        org_id: this.org_id,
        bridge_id: this.bridge_id,
        model: this.configuration?.model,
        channel: 'chat',
        type: "error",
        actor: this.user ? "user" : "tool"
      });

      // if (this.rtlLayer) {
      //   // rtlayer.message({
      //   //   ...this.req.body,
      //   //   error: openAIResponse?.error,
      //   //   success: false
      //   // }, this.req.body.rtlOptions).then(data => {
           
      //   //   console.log("message sent", data);
      //   // }).catch(error => {
      //   //   console.error("message not sent", error);
      //   // });
      //   // await this.responseSender.sendResponse('rtlayer', { error: openAIResponse?.error, success: false }, this.req.body, {});
      //   this.responseSender.sendResponse({
      //     method: 'rtlayer',
      //     data: {error: openAIResponse?.error, success: false },
      //     reqBody: this.req.body,
      //     headers: {}
      //   });

      //   return { success: false, error: openAIResponse?.error };
      // }
      // if (this.webhook) {
      //   // await this.responseSender.sendResponse('webhook', {
      //   //   error: openAIResponse?.error,
      //   //   success: false,
      //   // }, this.req.body, this.headers);
      //   this.responseSender.sendResponse({
      //     webhook : this.webhook,
      //     method: 'webhook',
      //     data: {error: openAIResponse?.error, success: false },
      //     reqBody: this.req.body,
      //     headers: this.headers
      //   });
      //   return { success: false, error: openAIResponse?.error };
      // }
      this.responseSender.sendResponse({
        rtlLayer : this.rtlLayer,
        webhook : this.webhook,
        data: {error: openAIResponse?.error, success: false },
        reqBody: this.req.body,
        headers: this.headers || {}
      });
    
      }
      return { success: false, error: openAIResponse?.error };
    }
   
    if (_.get(modelResponse, this.modelOutputConfig.tools) && this.apiCallavailable) {
      if (this.rtlLayer && !this.playground) {
       // await this.responseSender.sendResponse('rtlayer', { function_call: true, success: true }, this.req.body, {});
        // this.responseSender.sendResponse({
        //   method: 'rtlayer',
        //   data: { function_call: true, success: true  },
        //   reqBody: this.req.body,
        //   headers: {}
        // });
        this.responseSender.sendResponse({
          rtlLayer : this.rtlLayer,
          webhook : this.webhook,
          data: { function_call: true, success: true  },
          reqBody: this.req.body,
          headers: this.headers || {}
        });
      }
      const functionCallRes = await functionCall({configuration: this.customConfig,apikey: this.apikey, bridge: this.bridge,tools_call: _.get(modelResponse, this.modelOutputConfig.tools)[0], outputConfig: this.modelOutputConfig,l:0, rtlLayer: this.rtlLayer, body: this.req?.body, playground: this.playground});
      const funcModelResponse = _.get(functionCallRes, "modelResponse", {}); 

      if (!functionCallRes?.success) {
        usage = {
          service: this.service,
          model: this.model,
          orgId: this.org_id,
          latency: Date.now() - this.startTime,
          success: false,
          error: functionCallRes?.error
        };
        this.metrics_sevice.create([usage],{
          thread_id: this.thread_id,
          user: this.user ? this.user : JSON.stringify(this.tool_call),
          message: "",
          org_id: this.org_id,
          bridge_id: this.bridge_id,
          model: this.configuration?.model,
          channel: 'chat',
          type: "error",
          actor: this.user ? "user" : "tool"
        });

        // if (this.rtlLayer && !this.playground) {
        //   // await this.responseSender.sendResponse('rtlayer', {error: functionCallRes?.error, success: false }, this.req.body, {});
        //   // this.responseSender.sendResponse({
        //   //   method: 'rtlayer',
        //   //   data: {error: functionCallRes?.error, success: false },
        //   //   reqBody: this.req.body,
        //   //   headers: {}
        //   // });
        //   return { success: false, error: functionCallRes?.error };
        // }

        // if (this.webhook && !this.playground) {
        //   // await this.responseSender.sendResponse('webhook', {
        //   //   error: functionCallRes?.error,
        //   //   success: false,
        //   // }, this.req.body, this.headers);
        //   this.responseSender.sendResponse({
        //     webhook : this.webhook,
        //     method: 'webhook',
        //     data: {error:functionCallRes?.error, success: false },
        //     reqBody: this.req.body,
        //     headers: this.headers
        //   });
        //   return { success: false, error: functionCallRes?.error };
        // }
        this.responseSender.sendResponse({
          rtlLayer : this.rtlLayer,
          webhook : this.webhook,
          data: {error: functionCallRes?.error, success: false },
          reqBody: this.req.body,
          headers: this.headers || {}
        });

        return { success: false, error: functionCallRes?.error };
      }

      _.set(modelResponse, this.modelOutputConfig.message, _.get(funcModelResponse, this.modelOutputConfig.message));
      _.set(modelResponse, this.modelOutputConfig.tools, _.get(funcModelResponse, this.modelOutputConfig.tools));
      _.set(modelResponse, this.modelOutputConfig.usage[0].total_tokens, _.get(funcModelResponse, this.modelOutputConfig.usage[0].total_tokens) + _.get(modelResponse, this.modelOutputConfig.usage[0].total_tokens));
      _.set(modelResponse, this.modelOutputConfig.usage[0].prompt_tokens, _.get(funcModelResponse, this.modelOutputConfig.usage[0].prompt_tokens) + _.get(modelResponse, this.modelOutputConfig.usage[0].prompt_tokens));
      _.set(modelResponse, this.modelOutputConfig.usage[0].completion_tokens, _.get(funcModelResponse, this.modelOutputConfig.usage[0].completion_tokens) + _.get(modelResponse, this.modelOutputConfig.usage[0].completion_tokens));
    }
    usage = {
      totalTokens: _.get(modelResponse, this.modelOutputConfig.usage[0].total_tokens),
      inputTokens: _.get(modelResponse, this.modelOutputConfig.usage[0].prompt_tokens),
      outputTokens: _.get(modelResponse, this.modelOutputConfig.usage[0].completion_tokens),
      expectedCost: (_.get(modelResponse, this.modelOutputConfig.usage[0].prompt_tokens) / 1000 * this.modelOutputConfig.usage[0].total_cost.input_cost) + (_.get(modelResponse, this.modelOutputConfig.usage[0].completion_tokens) / 1000 * this.modelOutputConfig.usage[0].total_cost.output_cost)
    };
   if(!this.playground){
     historyParams = {
       thread_id: this.thread_id,
       user: this.user ? this.user : JSON.stringify(this.tool_call),
       message: _.get(modelResponse, this.modelOutputConfig.message) == null ? _.get(modelResponse, this.modelOutputConfig.tools) : _.get(modelResponse, this.modelOutputConfig.message),
       org_id: this.org_id,
       bridge_id: this.bridge_id,
       model: this.configuration?.model,
       channel: 'chat',
       type: _.get(modelResponse, this.modelOutputConfig.message) == null ? "tool_calls" : "assistant",
       actor: this.user ? "user" : "tool"
      };
  }

    return { success: true, modelResponse, historyParams, usage };
  }
}

export {
  UnifiedOpenAICase,
};