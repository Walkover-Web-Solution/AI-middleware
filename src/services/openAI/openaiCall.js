// 

import { chats } from "./chat.js";
import conversationService from "../commonService/createConversation.js";
import _ from "lodash";
import functionCall from "./functionCall.js";
import Helper from "../utils/helper.js";

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
    this.rtlLayer = params.rtlLayer;
    this.req = params.req; 
    this.modelOutputConfig = params.modelOutputConfig;
    this.apiCallavailable =  params.bridge?.is_api_call ?? false;
    this.playground = params.playground;
    this.metrics_sevice = params.metrics_sevice;
    this.sendRequest = params.sendRequest;
    this.rtlayer = params.rtlayer;
    this.webhook = params.webhook;
    this.headers = params.headers;
  }

  async execute() {
    let historyParams = {};
    let prompt = this.configuration.prompt ?? [];
    prompt = Array.isArray(prompt) ? prompt : [prompt];
    const conversation = this.configuration?.conversation ? conversationService.createOpenAIConversation(this.configuration.conversation).messages : [];

    prompt = Helper.replaceVariablesInPrompt(prompt, this.variables);

    this.customConfig["messages"] = [...prompt, ...conversation, this.user ? { role: "user", content: this.user } : this.tool_call];
    console.log(555,this.customConfig["messages"]);
    console.log(666, this.user);
    const openAIResponse = await chats(this.customConfig, this.apikey);
    console.log(777,openAIResponse);
    let modelResponse = _.get(openAIResponse, "modelResponse", {});

    if (!openAIResponse?.success) {
      if(!this.playground){
      let usage = {
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

      if (this.rtlLayer) {
        this.rtlayer.message({
          ...this.req.body,
          error: openAIResponse?.error,
          success: false
        }, this.req.body.rtlOptions).then(data => {
          console.log("message sent", data);
        }).catch(error => {
          console.log("message not sent", error);
        });
        return { success: false, error: openAIResponse?.error };
      }
      if (this.webhook) {
        await this.sendRequest(this.webhook, {
          error: openAIResponse?.error,
          success: false,
          ...this.req.body
        }, 'POST', this.headers);
        return { success: false, error: openAIResponse?.error };
      }
      
      }
      return { success: false, error: openAIResponse?.error };
    }
    console.log(this.apiCallavailable, this.bridge, this.playground);
   
    if (_.get(modelResponse, this.modelOutputConfig.tools) && this.apiCallavailable) {
      if (this.rtlLayer && !this.playground) {
        this.rtlayer.message({
          ...this.req.body,
          message: "Function call",
          function_call: true,
          success: true
        }, this.req.body.rtlOptions).then(data => {
          console.log("RTLayer message sent", data);
        }).catch(error => {
          console.log("RTLayer message not sent", error);
        });
      }
  
      const functionCallRes = await functionCall(this.customConfig, this.apikey, this.bridge, _.get(modelResponse, this.modelOutputConfig.tools)[0], this.modelOutputConfig, this.rtlayer, this.req?.body, this.playground);
      const funcModelResponse = _.get(functionCallRes, "modelResponse", {});

      if (!functionCallRes?.success) {
        let usage = {
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

        if (this.rtlLayer && !this.playground) {
          this.rtlayer.message({
            ...this.req.body,
            error: functionCallRes?.error,
            success: false
          }, this.req.body.rtlOptions).then(data => {
            console.log("message sent", data);
          }).catch(error => {
            console.log("message not sent", error);
          });
          return { success: false, error: functionCallRes?.error };
        }

        if (this.webhook && !this.playground) {
          await this.sendRequest(this.webhook, {
            error: functionCallRes?.error,
            success: false,
            ...this.req.body
          }, 'POST', this.headers);
          return { success: false, error: functionCallRes?.error };
        }

        return { success: false, error: functionCallRes?.error };
      }

      _.set(modelResponse, this.modelOutputConfig.message, _.get(funcModelResponse, this.modelOutputConfig.message));
      _.set(modelResponse, this.modelOutputConfig.tools, _.get(funcModelResponse, this.modelOutputConfig.tools));
      _.set(modelResponse, this.modelOutputConfig.usage[0].total_tokens, _.get(funcModelResponse, this.modelOutputConfig.usage[0].total_tokens) + _.get(modelResponse, this.modelOutputConfig.usage[0].total_tokens));
      _.set(modelResponse, this.modelOutputConfig.usage[0].prompt_tokens, _.get(funcModelResponse, this.modelOutputConfig.usage[0].prompt_tokens) + _.get(modelResponse, this.modelOutputConfig.usage[0].prompt_tokens));
      _.set(modelResponse, this.modelOutputConfig.usage[0].completion_tokens, _.get(funcModelResponse, this.modelOutputConfig.usage[0].completion_tokens) + _.get(modelResponse, this.modelOutputConfig.usage[0].completion_tokens));
    }
    // let usage = {
    //   service: this.service,
    //   model: this.model,
    //   orgId: this.org_id,
    //   latency: Date.now() - this.startTime,
    //   success: true,
    //   totalTokens: _.get(modelResponse, this.modelOutputConfig.usage[0].total_tokens),
    //   inputTokens: _.get(modelResponse, this.modelOutputConfig.usage[0].prompt_tokens),
    //   outputTokens: _.get(modelResponse, this.modelOutputConfig.usage[0].completion_tokens),
    //   expectedCost: (_.get(modelResponse, this.modelOutputConfig.usage[0].prompt_tokens) / 1000 * this.modelOutputConfig.usage[0].total_cost.input_cost) + (_.get(modelResponse, this.modelOutputConfig.usage[0].completion_tokens) / 1000 * this.modelOutputConfig.usage[0].total_cost.output_cost)
    // };
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
    
    if (this.webhook) {
      await this.sendRequest(this.webhook, {
        success: true,
        response: modelResponse,
        ...this.req.body
      }, 'POST', this.headers);
      return { success: true, modelResponse, historyParams };
    }

    if (this.rtlLayer) {
      this.rtlayer.message({
        ...this.req.body,
        response: modelResponse,
        success: true
      }, this.req.body.rtlOptions).then(data => {
        console.log("message sent", data);
      }).catch(error => {
        console.log("message not sent", error);
      });
      return { success: true, modelResponse, historyParams };
    }
  }

    return { success: true, modelResponse, historyParams };
  }
}

export {
  UnifiedOpenAICase,
};
