import ConfigurationServices from "../db_services/configuration.service.js";
import folderDbService from "../db_services/folder.service.js";
import bridgeVersionDbService from "../db_services/bridgeVersion.service.js";
import { callAiMiddleware } from "../services/utils/aiCall.utils.js";
import { bridge_ids, new_agent_service, redis_keys } from "../configs/constant.js";
import Helper from "../services/utils/helper.utils.js";
import { ObjectId } from "mongodb";
import conversationDbService from "../db_services/conversation.service.js";
const { storeSystemPrompt, addBulkUserEntries } = conversationDbService;
import { getDefaultValuesController } from "../services/utils/getDefaultValue.js";
import { purgeRelatedBridgeCaches } from "../services/utils/redis.utils.js";
import { validateJsonSchemaConfiguration } from "../services/utils/common.utils.js";
import {
    createBridgeSchema,
    updateBridgeSchema,
    bridgeIdParamSchema,
    modelNameParamSchema,
    cloneAgentSchema
} from "../validation/joi_validation/agentConfig.js";

const createBridgesController = async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = createBridgeSchema.validate(req.body);
        if (error) {
            res.locals = { success: false, message: error.details[0].message };
            req.statusCode = 400;
            return next();
        }
        const bridges = value;
        const purpose = bridges.purpose;
        const bridgeType = bridges.bridgeType || 'api';
        const org_id = req.profile.org.id;
        const folder_id = req.folder_id || null;
        const folder_data = await folderDbService.getFolderData(folder_id);
        const user_id = req.profile.user.id;
        const all_bridge = await ConfigurationServices.getBridgesByUserId(org_id); // Assuming this returns all bridges for org

        let prompt = "Role: AI Bot\nObjective: Respond logically and clearly, maintaining a neutral, automated tone.\nGuidelines:\nIdentify the task or question first.\nProvide brief reasoning before the answer or action.\nKeep responses concise and contextually relevant.\nAvoid emotion, filler, or self-reference.\nUse examples or placeholders only when helpful.";
        let name = null;
        let service = "ai_ml";
        let model = "gpt-oss-120b";
        let type = "chat";

        if (bridges.templateId) {
            const template_id = bridges.templateId;
            const template_data = await ConfigurationServices.gettemplateById(template_id);
            if (!template_data) {
                res.locals = { success: false, message: "Template not found" };
                req.statusCode = 404;
                return next();
            }
            prompt = template_data.prompt || prompt;
        }

        const all_bridge_name = all_bridge.map(bridge => bridge.name);

        if (purpose) {
            const variables = {
                "purpose": purpose,
                "all_bridge_names": all_bridge_name
            };
            const user = "Generate Bridge Configuration accroding to the given user purpose.";
            const bridge_data = await callAiMiddleware(user, bridge_ids['create_bridge_using_ai'], variables);
            // Assuming bridge_data is parsed JSON from callAiMiddleware
            if (typeof bridge_data === 'object') {
                model = bridge_data.model || model;
                service = bridge_data.service || service;
                name = bridge_data.name;
                prompt = bridge_data.system_prompt || prompt;
                type = bridge_data.type || type;
            }
        }

        let name_next_count = 1;
        let slug_next_count = 1;

        for (const bridge of all_bridge) {
            name = name || "untitled_agent";
            if (name.startsWith("untitled_agent") && bridge.name.startsWith("untitled_agent_")) {
                const num = parseInt(bridge.name.replace("untitled_agent_", ""));
                if (num >= name_next_count) name_next_count = num + 1;
            } else if (bridge.name === name) {
                name_next_count += 1;
            }

            if (name.startsWith("untitled_agent") && bridge.slugName.startsWith("untitled_agent_")) {
                const num = parseInt(bridge.slugName.replace("untitled_agent_", ""));
                if (num >= slug_next_count) slug_next_count = num + 1;
            } else if (bridge.slugName === name) {
                slug_next_count += 1;
            }
        }

        const slugName = `${name}_${slug_next_count}`;
        name = `${name}_${name_next_count}`;

        // Construct model data - simplified logic
        const model_data = {
            model: model,
            type: type,
            response_format: { type: "default", cred: {} },
            is_rich_text: false,
            prompt: prompt
        };

        const fall_back = {
            is_enable: true,
            service: "ai_ml",
            model: "gpt-oss-120b"
        };

        if (folder_data) {
            const api_key_object_ids = folder_data.apikey_object_id || {};
            if (Object.keys(api_key_object_ids).length > 0) {
                service = Object.keys(api_key_object_ids)[0];
                if (new_agent_service[service]) {
                    model_data.model = new_agent_service[service];
                }
            }
        }

        const bridge_limit = bridges.bridge_limit || 0;
        const bridge_usage = bridges.bridge_usage || 0;

        const result = await ConfigurationServices.createBridge({
            configuration: model_data,
            name: name,
            slugName: slugName,
            service: service,
            bridgeType: bridgeType,
            org_id: org_id,
            status: 1,
            gpt_memory: true,
            folder_id: folder_id,
            user_id: user_id,
            fall_back: fall_back,
            bridge_limit: bridge_limit,
            bridge_usage: bridge_usage,
            bridge_status: 1
        });

        const create_version = await bridgeVersionDbService.createBridgeVersion(result.bridge);
        const update_fields = { versions: [create_version._id.toString()] };
        const updated_bridge_result = await ConfigurationServices.updateBridge(result.bridge._id.toString(), update_fields);

        res.locals = {
            success: true,
            message: "Bridge created successfully",
            bridge: updated_bridge_result.result
        };
        req.statusCode = 200;
        return next();

    } catch (e) {
        res.locals = { success: false, message: "Error in creating bridge: " + e.message };
        req.statusCode = 400;
        return next();
    }
};

const updateBridgeController = async (req, res, next) => {
    try {
        // Validate params
        const { error: paramsError, value: paramsValue } = bridgeIdParamSchema.validate(req.params);
        if (paramsError) {
            res.locals = { success: false, message: paramsError.details[0].message };
            req.statusCode = 400;
            return next();
        }
        const { bridgeId, version_id } = paramsValue;

        // Validate request body
        const { error: bodyError, value: bodyValue } = updateBridgeSchema.validate(req.body);
        if (bodyError) {
            res.locals = { success: false, message: bodyError.details[0].message };
            req.statusCode = 400;
            return next();
        }
        const body = bodyValue;
        const org_id = req.profile.org.id;
        const user_id = req.profile.user.id;
        const bridgeData = await ConfigurationServices.getBridgesWithTools(null, org_id, version_id);
        if (!bridgeData.bridges) {
            res.locals = { success: false, message: "Bridge not found" };
            req.statusCode = 404;
            return next();
        }
        const bridge = bridgeData.bridges;
        const parent_id = bridge.parent_id;
        const current_configuration = bridge.configuration || {};
        let current_variables_path = bridge.variables_path || {};
        let function_ids = bridge.function_ids || [];

        const update_fields = {};
        const user_history = [];

        const new_configuration = body.configuration;
        const service = body.service;
        const page_config = body.page_config;
        const web_search_filter = body.web_search_filters;

        if (new_configuration) {
            const { isValid, errorMessage } = validateJsonSchemaConfiguration(new_configuration);
            if (!isValid) {
                res.locals = { success: false, message: errorMessage };
                req.statusCode = 400;
                return next();
            }
        }

        if (body.connected_agent_details) {
            update_fields.connected_agent_details = body.connected_agent_details;
        }

        if (body.apikey_object_id) {
            const apikey_object_id = body.apikey_object_id;
            await ConfigurationServices.getApikeyCreds(org_id, apikey_object_id);
            update_fields.apikey_object_id = apikey_object_id;

            if (version_id) {
                await ConfigurationServices.updateApikeyCreds(version_id, apikey_object_id);
            }
        }

        if (new_configuration && new_configuration.prompt) {
            const prompt_result = await storeSystemPrompt(new_configuration.prompt, org_id, parent_id || version_id);
            if (prompt_result && prompt_result.id) {
                new_configuration.system_prompt_version_id = prompt_result.id;
            }
        }

        if (new_configuration && new_configuration.type && new_configuration.type !== 'fine-tune') {
            new_configuration.fine_tune_model = { current_model: null };
        }

        const simple_fields = ['bridge_status', 'bridge_summary', 'expected_qna', 'slugName', 'tool_call_count', 'user_reference', 'gpt_memory', 'gpt_memory_context', 'doc_ids', 'variables_state', 'IsstarterQuestionEnable', 'name', 'bridgeType', 'meta', 'fall_back', 'guardrails', 'web_search_filters'];

        for (const field of simple_fields) {
            if (body[field] !== undefined) {
                update_fields[field] = body[field];
            }
        }

        if (body.bridge_limit !== undefined) update_fields.bridge_limit = body.bridge_limit;
        if (body.bridge_usage !== undefined) update_fields.bridge_usage = body.bridge_usage;

        if (page_config) update_fields.page_config = page_config;
        if (web_search_filter) update_fields.web_search_filters = web_search_filter;

        if (service) {
            update_fields.service = service;
            if (new_configuration && new_configuration.model) {
                const configuration = await getDefaultValuesController(service, new_configuration.model, current_configuration, new_configuration.type);
                new_configuration = { ...configuration, type: new_configuration.type || 'chat' };
            }
        }

        if (new_configuration) {
            if (new_configuration.model && !service) {
                const current_service = bridge.service;
                const configuration = await getDefaultValuesController(current_service, new_configuration.model, current_configuration, new_configuration.type);
                new_configuration = { ...new_configuration, ...configuration, type: new_configuration.type || 'chat' };
            }
            update_fields.configuration = { ...current_configuration, ...new_configuration };
        }

        if (body.variables_path) {
            const variables_path = body.variables_path;
            const updated_variables_path = { ...current_variables_path, ...variables_path };
            for (const key in updated_variables_path) {
                if (Array.isArray(updated_variables_path[key])) {
                    updated_variables_path[key] = {};
                }
            }
            update_fields.variables_path = updated_variables_path;
            current_variables_path = updated_variables_path; // Update local reference
        }

        // Handle built-in tools
        if (body.built_in_tools_data) {
            const { built_in_tools, built_in_tools_operation } = body.built_in_tools_data;
            if (built_in_tools) {
                const op = built_in_tools_operation === '1' ? 1 : 0;
                await ConfigurationServices.updateBuiltInTools(version_id || bridgeId, built_in_tools, op);
            }
        }

        // Handle agents
        if (body.agents) {
            const { connected_agents, agent_status } = body.agents;
            if (connected_agents) {
                const op = agent_status === '1' ? 1 : 0;
                if (op === 0) {
                    for (const agent_name in connected_agents) {
                        const agent_info = connected_agents[agent_name];
                        if (agent_info.bridge_id && current_variables_path[agent_info.bridge_id]) {
                            delete current_variables_path[agent_info.bridge_id];
                            update_fields.variables_path = current_variables_path;
                        }
                    }
                }
                await ConfigurationServices.updateAgents(version_id || bridgeId, connected_agents, op);
            }
        }

        // Handle function data
        if (body.functionData) {
            const { function_id, function_operation, function_name } = body.functionData;
            if (function_id) {
                const op = function_operation === '1' ? 1 : 0;
                const target_id = version_id || bridgeId;

                if (op === 1) {
                    if (!function_ids.includes(function_id)) {
                        function_ids.push(function_id);
                        update_fields.function_ids = function_ids.map(fid => new ObjectId(fid));
                        await ConfigurationServices.updateBridgeIdsInApiCalls(function_id, target_id, 1);
                    }
                } else {
                    if (function_name && current_variables_path[function_name]) {
                        delete current_variables_path[function_name];
                        update_fields.variables_path = current_variables_path;
                    }
                    if (function_ids.includes(function_id)) {
                        function_ids = function_ids.filter(fid => fid.toString() !== function_id);
                        update_fields.function_ids = function_ids.map(fid => new ObjectId(fid));
                        await ConfigurationServices.updateBridgeIdsInApiCalls(function_id, target_id, 0);
                    }
                }
            }
        }

        // Build user history entries
        for (const key in body) {
            const value = body[key];
            const history_entry = {
                user_id: user_id,
                org_id: org_id,
                bridge_id: parent_id || '',
                version_id: version_id,
                time: new Date() // Python uses default time?
            };

            if (key === 'configuration') {
                for (const config_key in value) {
                    user_history.push({ ...history_entry, type: config_key });
                }
            } else {
                user_history.push({ ...history_entry, type: key });
            }
        }

        if (version_id) {
            if (body.version_description === undefined) {
                update_fields.is_drafted = true;
            } else {
                update_fields.version_description = body.version_description;
            }
        }

        await ConfigurationServices.updateBridge(bridgeId, update_fields, version_id);
        const updatedBridge = await ConfigurationServices.getBridgesWithTools(bridgeId, org_id, version_id);

        await addBulkUserEntries(user_history);

        try {
            await purgeRelatedBridgeCaches(bridgeId, body.bridge_usage !== undefined ? body.bridge_usage : -1);
        } catch (e) {
            console.error(`Failed clearing bridge related cache on update: ${e}`);
        }

        if (service) {
            updatedBridge.bridges.service = service;
        }

        const response = await Helper.responseMiddlewareForBridge(updatedBridge.bridges.service, {
            success: true,
            message: "Bridge Updated successfully",
            bridge: updatedBridge.bridges
        }, true);

        res.locals = response;
        req.statusCode = 200;
        return next();

    } catch (e) {
        console.error("Error in updateBridgeController:", e);
        res.locals = { success: false, message: e.message };
        req.statusCode = 500;
        return next();
    }
};

const getBridgesAndVersionsByModelController = async (req, res, next) => {
    try {
        // Validate params
        const { error, value } = modelNameParamSchema.validate(req.params);
        if (error) {
            res.locals = { success: false, message: error.details[0].message };
            req.statusCode = 400;
            return next();
        }
        const { modelName } = value;
        const result = await ConfigurationServices.getBridgesAndVersionsByModel(modelName);
        res.locals = {
            success: true,
            message: "Fetched models and bridges they are used in successfully.",
            [modelName]: result
        };
        req.statusCode = 200;
        return next();
    } catch (e) {
        res.locals = { success: false, message: e.message };
        req.statusCode = 500;
        return next();
    }
};

const cloneAgentController = async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = cloneAgentSchema.validate(req.body);
        if (error) {
            res.locals = { success: false, message: error.details[0].message };
            req.statusCode = 400;
            return next();
        }
        const { bridge_id, to_shift_org_id } = value;
        const result = await ConfigurationServices.cloneAgentToOrg(bridge_id, to_shift_org_id);
        res.locals = result;
        req.statusCode = result.success ? 200 : 400;
        return next();
    } catch (e) {
        res.locals = { success: false, message: e.message };
        req.statusCode = 500;
        return next();
    }
};

const getBridgeController = async (req, res, next) => {
    try {
        // Validate params
        const { error, value } = bridgeIdParamSchema.validate(req.params);
        if (error) {
            res.locals = { success: false, message: error.details[0].message };
            req.statusCode = 400;
            return next();
        }
        const { bridgeId } = value;
        const org_id = req.profile.org.id;

        const bridge = await ConfigurationServices.getBridgesWithTools(bridgeId, org_id);

        if (!bridge.bridges) {
            res.locals = { success: false, message: "Bridge not found" };
            req.statusCode = 404;
            return next();
        }

        const prompt = bridge.bridges.configuration?.prompt;
        let variables = [];
        if (prompt) {
            variables = Helper.findVariablesInString(prompt);
        }

        const variables_path = bridge.bridges.variables_path || {};
        const path_variables = [];
        for (const key in variables_path) {
            const val = variables_path[key];
            if (typeof val === 'object') {
                path_variables.push(...Object.keys(val));
            } else {
                path_variables.push(val);
            }
        }

        const all_variables = [...variables, ...path_variables];
        bridge.bridges.all_varaibles = all_variables;

        // Simplified response middleware
        res.locals = {
            success: true,
            message: "bridge get successfully",
            bridge: bridge.bridges
        };
        req.statusCode = 200;
        return next();

    } catch (e) {
        res.locals = { success: false, message: e.message };
        req.statusCode = 400;
        return next();
    }
};

const getAllBridgesController = async (req, res, next) => {
    try {
        const org_id = req.profile.org.id;
        const folder_id = req.folder_id || null;
        const user_id = req.profile.user.id || null;
        const isEmbedUser = req.embed;

        const bridges = await ConfigurationServices.getAllBridgesInOrg(org_id, folder_id, user_id, isEmbedUser);

        res.locals = {
            success: true,
            message: "Get all bridges successfully",
            bridge: bridges,
            org_id: org_id
        };
        req.statusCode = 200;
        return next();

    } catch (e) {
        res.locals = { success: false, message: e.message };
        req.statusCode = 500;
        return next();
    }
};

const deleteBridges = async (req, res, next) => {
    const { bridge_id } = req.params;
    const { org_id, restore = false } = req.body;
    try {

        let result;

        if (restore) {
            // Restore the bridge
            result = await ConfigurationServices.restoreBridge(bridge_id, org_id);

            // Log restore operation for audit purposes
            if (result.success) {
                console.log(`Bridge restore completed for bridge ${bridge_id} and ${result.restoredVersionsCount || 0} versions for org ${org_id}`);
            }
        } else {
            // Soft delete the bridge
            result = await ConfigurationServices.deleteBridge(bridge_id, org_id);

            // Log soft delete operation for audit purposes
            if (result.success) {
                console.log(`Soft delete initiated for bridge ${bridge_id} and ${result.deletedVersionsCount || 0} versions for org ${org_id}`);
            }
        }

        res.locals = result;
        req.statusCode = result?.success ? 200 : 400;
        return next();
    } catch (error) {
        console.error(`${restore ? 'restore' : 'delete'} bridge error => `, error.message)
        throw error;
    }
};


export {
    createBridgesController,
    getBridgeController,
    getAllBridgesController,
    updateBridgeController,
    getBridgesAndVersionsByModelController,
    cloneAgentController,
    deleteBridges
};
