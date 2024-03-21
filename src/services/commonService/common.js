const { services, messageRoles } = require("../../../config/models");
const ModelsConfig = require("../../configs/modelConfiguration");
const {chats}= require("../openAI/chat");
const {getThread,savehistory}=require("../../controllers/conversationContoller");
const conversationService=require("./createConversation");
const configurationService=require("../../db_services/ConfigurationServices");
const {sendRequest}=require("../utils/request");
const {getConfiguration}=require("../utils/getConfiguration");
const _ = require('lodash');
const { v1: uuidv1 } = require('uuid');
const { completion } = require("../openAI/completion");
const {embeddings} = require("../openAI/embedding");
const {runChat} = require("../Google/gemini");
const {create}=require("../../db_services/metrics_services");

const getchat = async (req, res) => {
    try {
        const { apikey, configuration = {}, service = "" } = req.body;
        const { model } = configuration;
        const lowerCaseService = service.toLowerCase();

        if (!(lowerCaseService in services && services[lowerCaseService]["chat"].has(model))) {
            return res.status(400).json({ success: false, error: "model or service does not exist!" });
        }

        const modelname = model.replaceAll(/[-.]/g, "_");
        const { configuration: modelConfig, outputConfig: modelOutputConfig } = ModelsConfig[modelname]();
        const customConfig = Object.keys(modelConfig).reduce((acc, key) => {
            if (modelConfig[key]["level"] === 2 || key in configuration) {
                acc[key] = configuration[key] ?? modelConfig[key]["default"];
            }
            return acc;
        }, {});

        let modelResponse = {};
        switch (lowerCaseService) {
            case "openai":
                const prompt = [].concat(configuration.prompt ?? []);
                const conversation = configuration.conversation || [];
                customConfig.messages = [...prompt, ...conversation, configuration.user];
                const openAIResponse = await chats(customConfig, apikey);
                if (!openAIResponse?.success) {
                    return res.status(400).json({ success: false, error: openAIResponse?.error });
                }
                modelResponse = openAIResponse.modelResponse || {};
                break;
            case "google":
                const geminiResponse = await runChat({
                    generationConfig: customConfig,
                    model,
                    user_input: configuration.user
                }, apikey, "chat");
                if (!geminiResponse?.success) {
                    return res.status(400).json({ success: false, error: geminiResponse?.error });
                }
                modelResponse = geminiResponse.modelResponse || {};
                break;
        }

        return res.status(200).json({ success: true, response: modelResponse });
    } catch (error) {
        console.error("common error=>", error);
        return res.status(400).json({ success: false, error: error.message });
    }
}

const prochat = async (req, res) => {
    const startTime = Date.now();
    let { apikey, bridge_id, configuration, thread_id, org_id, user, tool_call, service, variables } = req.body;
    let usage = {}, modelResponse = {}, customConfig = {};
    let model = configuration?.model;
    try {
        const getconfig=await getConfiguration(configuration,service,bridge_id);
        if(!getconfig.success){
            return res.status(400).json({ success: false, error: getconfig.error });
        }
        configuration=getconfig.configuration;
        service = getconfig.service;
        model = configuration?.model;
        if (!(service in services && services[service]["chat"].has(model))) {
            return res.status(400).json({ success: false, error: "model or service does not exist!" });
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
                // let conversation = createConversation(result.data);
                configuration["conversation"] = result?.data ? result.data : [];
            }
        } else {
            thread_id = uuidv1();
        }

        switch (service) {
            case "openai":
                const conversation = configuration?.conversation ? conversationService.createOpenAIConversation(configuration.conversation).messages : [];
                console.time("bhasad")
                let prompt = configuration.prompt ?? [];
                prompt =Array.isArray(prompt)  ? prompt:[prompt];
        if (variables && Object.keys(variables).length > 0) {
Object.entries(variables).forEach(([key, value]) => {
                        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            prompt = prompt.map(item => {
                if(item && "content" in item){
                        item.content = item.content.replace(regex, value);
                    return item;
            }
                        });
        });
                }
                console.log("conversation=>",conversation)
                
                customConfig["messages"] = [...prompt, ...conversation, !user ? tool_call : { role: "user", content: user }];
                console.timeEnd("bhasad")
                const openAIResponse = await chats(customConfig, apikey);

                modelResponse = _.get(openAIResponse, "modelResponse", {});
                if (!openAIResponse?.success) {
                    usage={service:service,model:model,orgId:org_id,latency:Date.now() - startTime,success:false,error:openAIResponse?.error};
                    create([usage])
                    return res.status(400).json({ success: false, error: openAIResponse?.error });
                }
                usage["totalTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].total_tokens);
                usage["inputTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].prompt_tokens);
                usage["outputTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].completion_tokens);
                usage["expectedCost"] = ((usage.inputTokens / 1000)*_.get(modelResponse, modelOutputConfig.usage[0].total_cost.input_cost))+((usage.outputTokens / 1000)*_.get(modelResponse, modelOutputConfig.usage[0].total_cost.output_cost));
                savehistory(thread_id, user ? user : JSON.stringify(tool_call),
                    _.get(modelResponse, modelOutputConfig.message) == null ? _.get(modelResponse, modelOutputConfig.tools) : _.get(modelResponse, modelOutputConfig.message),
                    org_id, bridge_id, configuration?.model, 'chat',
                    _.get(modelResponse, modelOutputConfig.message) == null ? "tool_calls" : "assistant", user ? "user" : "tool");
                break;

            case "google":
                let geminiConfig = {
                    generationConfig:customConfig,
                    model:configuration?.model,
                    user_input:user
                }
                geminiConfig["history"]=configuration?.conversation ? conversationService.createGeminiConversation(configuration.conversation ).messages:[];
const geminiResponse = await runChat(geminiConfig,apikey,"chat");
                modelResponse = _.get(geminiResponse, "modelResponse", {});

        if (!geminiResponse?.success) {
            usage={service:service,model:model,orgId:org_id,latency:Date.now() - startTime,success:false,error:geminiResponse?.error};
            create([usage])
            return res.status(400).json({ success: false, error: geminiResponse?.error });
        }
usage["totalTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].total_tokens);
                usage["inputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].prompt_tokens);
                usage["outputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].output_tokens);
                usage["expectedCost"] = _.get(geminiResponse, modelOutputConfig.usage[0].total_cost);
savehistory(thread_id, user, 
                _.get(modelResponse, modelOutputConfig.message), 
                org_id, bridge_id, configuration?.model, 'chat', 
                "model",  "user");
                break;

        }

        const endTime = Date.now();
        usage={...usage,service:service,model:model,orgId:org_id,latency:endTime - startTime,success:true};
        create([usage])
        const { webhook, headers = {} } = configuration;
        if (webhook) {
            sendRequest(webhook, { response: modelResponse, ...req.body }, 'POST', headers);
        }

        return res.status(200).json({ success: true, response: modelResponse });



    } catch (error) {
        const endTime = Date.now();
        const latency = endTime - startTime;
        usage={...usage,service:service,model:model,orgId:org_id,latency:latency,success:false,error:error.message};
        create([usage]);
        console.log("prochats common error=>", error);
                return res.status(400).json({ success: false, error: error.message });
    }
}
const getCompletion = async (req, res) => {
    try {
        const { apikey, configuration = {}, service: serviceRaw } = req.body;
        const service = serviceRaw ? serviceRaw.toLowerCase() : '';
        const model = configuration.model;

        if (!(service in services && services[service]["completion"].has(model))) {
            return res.status(400).json({ success: false, error: "model or service does not exist!" });
        }

        const modelName = model.replaceAll(/[-.]/g, "_");
        const { configuration: modelConfig, outputConfig: modelOutputConfig } = ModelsConfig[modelName]();

        // Building customConfig with attention to level and defaults
        let customConfig = {};
        Object.keys(modelConfig).forEach(key => {
            if (modelConfig[key].level == 2 || key in configuration) {
                customConfig[key] = key in configuration ? configuration[key] : modelConfig[key].default;
            }
        });

        let modelResponse = {};
        if (service === "openai") {
            customConfig.prompt = configuration.prompt || "";
            const openAIResponse = await completion(customConfig, apikey);
            if (!openAIResponse?.success) {
                return res.status(400).json({ success: false, error: openAIResponse?.error });
            }
            modelResponse = _.get(openAIResponse, "modelResponse", {});
        } else if (service === "google") {
            const geminiResponse = await runChat({
                prompt: configuration.prompt || "",
                model: configuration.model
            }, apikey, "completion");
            if (!geminiResponse?.success) {
                return res.status(400).json({ success: false, error: geminiResponse?.error });
            }
            modelResponse = _.get(geminiResponse, "modelResponse", {});
        }

        return res.status(200).json({ success: true, response: modelResponse });
    } catch (error) {
        console.error("Get Completion common error=>", error);
        return res.status(400).json({ success: false, error: error.message });
    }
};




const proCompletion =async (req,res)=>{
    const startTime=Date.now();
    let { apikey,bridge_id,configuration,org_id,prompt,service} = req.body;
    console.log("org_id",org_id)
    let model = configuration?.model;
    let usage={}, modelResponse = {},customConfig={};
    try {
        const getconfig=await getConfiguration(configuration,service,bridge_id);
        if(!getconfig.success){
            return res.status(400).json({ success: false, error: getconfig.error });
        }
        configuration=getconfig.configuration;
        service = getconfig.service;
        model = configuration?.model;
        if (!(service in services && services[service]["completion"].has(model))) {
            return res.status(400).json({ success: false, error: "model or service does not exist!" });
        }
        const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
        const modelfunc = ModelsConfig[modelname];
        let { configuration: modelConfig, outputConfig: modelOutputConfig } = modelfunc();
        for (const key in modelConfig) {
            if (modelConfig[key]["level"] == 2 || key in configuration) {
                customConfig[key] = key in configuration ? configuration[key] : modelConfig[key]["default"];
            }
        }
        switch (service) {
            case "openai":
                configuration["prompt"] = configuration?.prompt ? configuration.prompt + "\n" + prompt : prompt;
                customConfig["prompt"] = configuration?.prompt || "";

                if (variables && Object.keys(variables).length > 0) {
                    Object.entries(variables).forEach(([key, value]) => {
                        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                        customConfig["prompt"] = customConfig.prompt.replace(regex, value);
                    });
                }
                
                console.log(customConfig);
                const openAIResponse = await completion(customConfig, apikey);
                modelResponse = _.get(openAIResponse, "modelResponse", {});

                if (!openAIResponse?.success) {
                    usage={service:service,model:model,orgId:org_id,latency:Date.now() - startTime,success:false,error:openAIResponse?.error};
                    create([usage])
                    return res.status(400).json({ success: false, error: openAIResponse?.error });
                }
                usage["totalTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].total_tokens);
                usage["inputTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].prompt_tokens);
                usage["outputTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].completion_tokens);
                usage["expectedCost"] = ((usage.inputTokens / 1000)*_.get(modelResponse, modelOutputConfig.usage[0].total_cost.input_cost))+((usage.outputTokens / 1000)*_.get(modelResponse, modelOutputConfig.usage[0].total_cost.output_cost));
                break;
            case "google":
                let geminiConfig = {
                    prompt:(configuration?.prompt||"")+"\n"+prompt||"",
                    model:configuration?.model
                }
const geminiResponse=await runChat(geminiConfig,apikey,"completion");
                modelResponse = _.get(geminiResponse, "modelResponse", {});

                if (!geminiResponse?.success) {
                    usage={service:service,model:model,orgId:org_id,latency:Date.now() - startTime,success:false,error:geminiResponse?.error};
                    create([usage])
                    return res.status(400).json({ success: false, error: geminiResponse?.error });
                }
                usage["totalTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].total_tokens);
                usage["inputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].input_tokens);
                usage["outputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].output_tokens);
                usage["expectedCost"] = _.get(geminiResponse, modelOutputConfig.usage[0].total_cost);
                break;
        }
        const endTime = Date.now();
        const { webhook, headers = {} } = configuration;
        if (webhook) {
            sendRequest(webhook, { response: modelResponse, ...req.body }, 'POST', headers);
        }
        const thread_id = uuidv1();
        savehistory(thread_id,prompt,_.get(modelResponse, modelOutputConfig.message),org_id,bridge_id,configuration?.model,'completion',"assistant");

        usage={...usage,service:service,model:model,orgId:org_id,latency:endTime - startTime,success:true};
        create([usage])
        return res.status(200).json({ success: true, response: modelResponse });

    }
    catch(error){
        const endTime = Date.now();
        const latency = endTime - startTime;
        usage={...usage,service:service,model:model,orgId:org_id,latency:latency,success:false,error:error.message};
        create([usage]);
        console.log("proCompletion common error=>", error);
        return res.status(400).json({ success: false, error: error.message });
    }
}

const getEmbeddings =async (req,res)=>{

    try {
        let { apikey, configuration, service } = req.body;
        const model = configuration?.model;
        let usage, modelResponse = {},customConfig={};
        service = service ? service.toLowerCase() : "";
        if (!(service in services && services[service]["embedding"].has(model))) {
            return res.status(400).json({ success: false, error: "model or service does not exist!" });
        }
        const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
        const modelfunc = ModelsConfig[modelname];
        let { configuration: modelConfig, outputConfig: modelOutputConfig } = modelfunc();
        for (const key in modelConfig) {
            if (modelConfig[key]["level"] == 2 || key in configuration) {
                customConfig[key] = key in configuration ? configuration[key] : modelConfig[key]["default"];
            }
        }
        switch (service) {
            case "openai":
                customConfig["input"] = configuration?.input||"";
                const openAIResponse = await embeddings(customConfig, apikey);
                modelResponse = _.get(openAIResponse, "modelResponse", {});

                if (!openAIResponse?.success) {
                    return res.status(400).json({ success: false, error: openAIResponse?.error });
                }
                usage = modelResponse[modelOutputConfig["usage"]];
                break;
            case "google":
                let geminiConfig = {
                    input:configuration?.input||"",
                    model:configuration?.model
                }
                const geminiResponse=await runChat(geminiConfig,apikey,"embedding");
                modelResponse = _.get(geminiResponse, "modelResponse", {});
                if (!geminiResponse?.success) {
                    return res.status(400).json({ success: false, error: geminiResponse?.error });
                }
                break;

        }

        return res.status(200).json({ success: true, response: modelResponse });

    }
    catch(error){
        console.log("proCompletion common error=>", error);
        return res.status(400).json({ success: false, error: error.message });
    }
}

const proEmbeddings =async (req,res)=>{

    const startTime=Date.now();
    let { apikey,bridge_id,configuration,org_id,input, service } = req.body;
    let model = configuration?.model;
    let usage={}, modelResponse = {},customConfig={};
    try {
        const getconfig=await getConfiguration(configuration,service,bridge_id);
        if(!getconfig.success){
            return res.status(400).json({ success: false, error: getconfig.error });
        }
        configuration=getconfig.configuration;
        service = getconfig.service;
        model = configuration?.model;
        if (!(service in services && services[service]["embedding"].has(model))) {
            return res.status(400).json({ success: false, error: "model or service does not exist!" });
        }
        const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
        const modelfunc = ModelsConfig[modelname];
        let { configuration: modelConfig, outputConfig: modelOutputConfig } = modelfunc();
        for (const key in modelConfig) {
            if (modelConfig[key]["level"] == 2 || key in configuration) {
                customConfig[key] = key in configuration ? configuration[key] : modelConfig[key]["default"];
            }
        }
        switch (service) {
            case "openai":
                customConfig["input"] = input || "";
                const response = await embeddings(customConfig, apikey);
                modelResponse = _.get(response, "modelResponse", {});
                if (!response?.success) {
                    usage={service:service,model:model,orgId:org_id,latency:Date.now() - startTime,success:false,error:response?.error};
                    create([usage])
                    return res.status(400).json({ success: false, error: response?.error });
                }
                usage["totalTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].total_tokens);
                usage["inputTokens"] = _.get(modelResponse, modelOutputConfig.usage[0].prompt_tokens);
                usage["outputTokens"] = usage["totalTokens"] - usage["inputTokens"];
                usage["expectedCost"] = ((usage.totalTokens / 1000)*_.get(modelResponse, modelOutputConfig.usage[0].total_cost));
                break;
            case "google":
                let geminiConfig = {
                    input: input || "",
                    model: configuration?.model
                }
                const geminiResponse=await runChat(geminiConfig,apikey,"embedding");
                modelResponse = _.get(geminiResponse, "modelResponse", {});
                if (!geminiResponse?.success) {
                    usage={service:service,model:model,orgId:org_id,latency:Date.now() - startTime,success:false,error:geminiResponse?.error};
                    create([usage])
                    return res.status(400).json({ success: false, error: geminiResponse?.error });
                }
                usage["totalTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].total_tokens);
                usage["inputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].input_tokens);
                usage["outputTokens"] = _.get(geminiResponse, modelOutputConfig.usage[0].output_tokens);
                usage["expectedCost"] = _.get(geminiResponse, modelOutputConfig.usage[0].total_cost);
                break;
        }
        const endTime = Date.now();
        const webhook= configuration?.webhook;
        const headers= configuration?.headers||{}
        if(webhook){
            sendRequest(webhook,{response:modelResponse,...req.body},'POST',headers)
        }
        const thread_id = uuidv1();
        savehistory(thread_id,input,JSON.stringify(_.get(modelResponse, modelOutputConfig.message)),org_id,bridge_id,configuration?.model,'embedding',"assistant");
        usage={...usage,service:service,model:model,orgId:org_id,latency:endTime - startTime,success:true};
        create([usage])
        return res.status(200).json({ success: true, response: modelResponse });
    }
    catch(error){
        const endTime = Date.now();
        const latency = endTime - startTime;
        usage={...usage,service:service,model:model,orgId:org_id,latency:latency,success:false,error:error.message};
        create([usage]);
        console.log("proembeddings common error=>", error);
        return res.status(400).json({ success: false, error: error.message });
    }
}

module.exports={
    getchat,
    prochat,
    getCompletion,
    proCompletion,
    getEmbeddings,
    proEmbeddings
}