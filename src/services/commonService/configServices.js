const ModelsConfig = require("../../configs/modelConfiguration");
const { services } = require("../../../config/models");
const { getAllThreads, getThreadHistory, getChatData } = require("../../controllers/conversationContoller");
const configurationService = require("../../db_services/ConfigurationServices");
const helper = require("../../services/utils/helper");
const { updateBridgeSchema } = require('../../../validation/joi_validation/bridge')
const { filterDataOfBridgeOnTheBaseOfUI } = require('../../services/utils/getConfiguration')
const conversationDbService = require('../../db_services/conversationDbService')
const _ = require('lodash');


const getAIModels = async (req, res) => {
    try {

        const service = req?.params?.service ? req?.params?.service.toLowerCase() : '';

        if (!(service in services)) {
            return res.status(400).json({ success: false, error: "service does not exist!" });
        }

        console.log(services[service]["models"].values())
        let modelInfo = {};
        for (const model of services[service]["models"].values()) {
            const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
            const modelfunc = ModelsConfig[modelname];
            let modelConfig = modelfunc().configuration;
            modelInfo[modelname] = modelConfig;
        }
        return res.status(200).json({ sucess: true, models: Array.from(services[service]["models"]), type: { embeddings: Array.from(services[service]["embedding"]), completions: Array.from(services[service]["completion"]), chats: Array.from(services[service]["chat"]) }, modelInfo: modelInfo });
    } catch (error) {
        console.log("common error=>", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const getThreads = async (req, res) => {
    try {
        const { thread_id, bridge_id } = req.params;
        const { org_id } = req.body;
        const threads = await getThreadHistory(thread_id, org_id, bridge_id);
        if (threads?.success) {
            return res.status(200).json(threads);
        }
        return res.status(400).json(threads);
    } catch (error) {
        console.log("common error=>", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const getMessageHistory = async (req, res) => {
    try {
        const { bridge_id } = req.params;
        const { org_id } = req.body;
        const threads = await getAllThreads(bridge_id, org_id);
        if (threads?.success) {
            return res.status(200).json(threads);
        }
        return res.status(400).json(threads);
    } catch (error) {
        console.log("common error=>", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const getSystemPromptHistory = async (req, res) => {
    try {
        const { bridge_id, timestamp } = req.params;
        const result = await conversationDbService.getHistory(bridge_id, timestamp);

        return res.status(200).json(result);
    } catch (error) {
        console.log("error occured", error);
        return res.status(400).json({ success: false, error: "something went wrong!" });
    }
}

const createBridges = async (req, res) => {
    try {
        let { configuration, org_id, service, bridgeType } = req.body;
        service = service ? service.toLowerCase() : "";
        if (!(service in services)) {
            return res.status(400).json({ success: false, error: "service does not exist!" });
        }
        const data = await configurationService.getBridgesByName(configuration?.name, org_id);
        if (data.success && data.bridges) {
            return res.status(400).json({ success: false, error: "bridge Name already exists! please choose unique one" });
        }
        const result = await configurationService.createBridges({ configuration: configuration, org_id, name: configuration?.name, service: service, apikey: helper.encrypt(""), bridgeType: bridgeType });
        if (result.success) {
            return res.status(200).json({ ...result });
        }
        return res.status(400).json(result);
    } catch (error) {
        console.log("common error=>", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const getAllBridges = async (req, res) => {
    try {
        const { org_id } = req.body;
        const result = await configurationService.getAllBridges(org_id);
        if (result.success) {
            return res.status(200).json({ ...result, org_id: org_id });
        }

        return res.status(400).json(result);
    } catch (error) {
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const getBridges = async (req, res) => {
    try {
        // console.log(req.params,res);
        const { bridge_id } = req.params;
        const result = await configurationService.getBridgesWithSelectedData(bridge_id);
        if (!result.success) {
            return res.status(400).json(result);
        }
        filterDataOfBridgeOnTheBaseOfUI(result, bridge_id)
        return res.status(200).json({ ...result });

    } catch (error) {
        console.log("common error=>", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const updateBridges = async (req, res) => {
    try {
        const { bridge_id } = req.params;
        let { configuration, org_id, service, apikey } = req.body;
        try {
            await updateBridgeSchema.validateAsync({ bridge_id, configuration, org_id, service, apikey });
        } catch (error) {
            return res.status(422).json({ success: false, error: error.details })
        }
        configuration["service"] = service;
        let modelConfig = await configurationService.getBridges(bridge_id)
        let bridge = modelConfig?.bridges;
        service = service ? service.toLowerCase() : "";
        if (!(service in services)) {
            return res.status(400).json({ success: false, error: "service does not exist!" });
        }
        if (apikey === null) {
            apikey = bridge.apikey;
        }
        apikey = apikey ? helper.encrypt(apikey) : helper.encrypt("");

        const model = configuration.model;
        const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
        const contentLocation = ModelsConfig[modelname]().inputConfig.content_location;
        const promptText = _.get(configuration, contentLocation);
        await conversationDbService.storeSystemPrompt(promptText, org_id, bridge_id);

        let prev_configuration = helper.updateConfiguration(bridge.configuration, configuration);
        const result = await configurationService.updateBridges(bridge_id, prev_configuration, org_id, apikey);
        filterDataOfBridgeOnTheBaseOfUI(result, bridge_id)
        if (result.success) {
            return res.status(200).json(result);
        }
        return res.status(400).json(result);
    } catch (error) {
        console.log("error:", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}

const updateBridgeType = async (req, res) => {
    try {
        const { bridge_id } = req.params;
        let { bridgeType, org_id } = req.body;
        const result = await configurationService.updateBridgeType(bridge_id, org_id, bridgeType);
        if (result.success) {
            return res.status(200).json(result);
        }
        return res.status(400).json(result);
    } catch (error) {
        console.log("error:", error);
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}


const deleteBridges = async (req, res) => {
    try {
        const { bridge_id } = req.params;
        const { org_id } = req.body;
        const result = await configurationService.deleteBridge(bridge_id, org_id);
        if (result.success) {
            return res.status(200).json(result);
        }
        return res.status(400).json(result);
    }
    catch (error) {
        return res.status(400).json({ success: false, error: "something went wrong!!" });
    }
}
const getAndUpdate = async (apiObjectID, bridge_id, org_id, openApiFormat, endpoint, requiredParams) => {
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
        updated_tools_call.push(openApiFormat);
        api_call[endpoint] = {
            apiObjectID: apiObjectID,
            requiredParams: requiredParams
        }
        tools_call = updated_tools_call;
        let configuration = { tools: tools_call }
        const newConfiguration = helper.updateConfiguration(modelConfig.bridges.configuration, configuration);
        let result = await configurationService.updateToolsCalls(bridge_id, org_id, newConfiguration, api_endpoints, api_call);
        result.tools_call = tools_call;
        return result;
    }
    catch (error) {
        console.log("error:", error);
        return { success: false, error: "something went wrong!!" }
    }
}

module.exports = {
    getAIModels,
    getThreads,
    getMessageHistory,
    createBridges,
    getAllBridges,
    getBridges,
    updateBridges,
    deleteBridges,
    getAndUpdate,
    updateBridgeType,
    getSystemPromptHistory
}