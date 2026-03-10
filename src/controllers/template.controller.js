import templateService from "../db_services/template.service.js";
import ConfigurationServices from "../db_services/configuration.service.js";
import agentVersionDbService from "../db_services/agentVersion.service.js";
import apiCallModel from "../mongoModel/ApiCall.model.js";
import { ObjectId } from "mongodb";
import { getUniqueNameAndSlug, normalizeFunctionIds, cloneFunctionsForAgent } from "../utils/agentConfig.utils.js";

const allTemplates = async (req, res, next) => {
  const result = await templateService.getAll();
  res.locals = {
    success: true,
    result
  };
  req.statusCode = 200;
  return next();
};

/**
 * Filter bridge/agent data to include only specific keys
 */
export function filterBridge(data) {
  const KEYS = [
    "_id",
    "configuration",
    "service",
    "bridgeType",
    "variables_state",
    "built_in_tools",
    "gpt_memory_context",
    "user_reference",
    "bridge_summary",
    "agent_variables",
    "function_data",
    "function_ids",
    "connected_agents"
  ];

  const pick = (obj) =>
    KEYS.reduce((acc, k) => {
      acc[k] = obj && Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : null;
      return acc;
    }, {});

  const toArray = (maybeObjOrArr) =>
    Array.isArray(maybeObjOrArr) ? maybeObjOrArr : maybeObjOrArr && typeof maybeObjOrArr === "object" ? Object.values(maybeObjOrArr) : [];

  return {
    bridge: pick(data || {}),
    child_agents: toArray(data?.child_agents).map(pick)
  };
}

/**
 * Create a template from an existing bridge/agent
 */
const createTemplate = async (req, res, next) => {
  const { agent_id } = req.params;
  const { templateName } = req.body;

  if (!agent_id) {
    throw new Error("agent_id is required");
  }

  if (!templateName) {
    throw new Error("templateName is required");
  }

  // Get the bridge data
  const bridgeData = await ConfigurationServices.getAgents(agent_id);
  if (!bridgeData.success || !bridgeData.bridges) {
    throw new Error("Bridge not found");
  }

  let bridge = bridgeData.bridges;

  // Get function data for each function_id in the bridge
  const functionData = [];
  if (bridge.function_ids && bridge.function_ids.length > 0) {
    for (const functionId of bridge.function_ids) {
      // Convert buffer to ObjectId if needed
      const id = functionId.buffer ? new ObjectId(Buffer.from(functionId.buffer)) : new ObjectId(functionId);

      const functionDetails = await apiCallModel.findOne({ _id: id }, { function_name: 1 });
      if (functionDetails) {
        functionData.push(functionDetails);
      }
    }
  }

  // Add function data to bridge
  bridge.function_data = functionData;
  bridge = filterBridge(bridge).bridge;
  bridge = Object.fromEntries(Object.entries(bridge).filter(([, v]) => v !== null));

  const buildConnectedAgents = async (connected_agents, ancestorIds = new Set()) => {
    const result = {};
    for (const [key, agent] of Object.entries(connected_agents)) {
      const agentBridgeId = agent.bridge_id?.toString?.() || agent.bridge_id;
      if (!agentBridgeId) continue;

      if (ancestorIds.has(agentBridgeId)) {
        result[key] = {
          description: agent.description,
          bridge_id: agentBridgeId,
          variables: agent.variables || {},
          bridge_details: {}
        };
        continue;
      }

      const childBridgeData = await ConfigurationServices.getAgents(agentBridgeId);
      if (!childBridgeData.success || !childBridgeData.bridges) continue;

      let childBridge = childBridgeData.bridges;
      const childFunctionData = [];
      if (childBridge.function_ids && childBridge.function_ids.length > 0) {
        for (const functionId of childBridge.function_ids) {
          const id = functionId.buffer ? new ObjectId(Buffer.from(functionId.buffer)) : new ObjectId(functionId);
          const functionDetails = await apiCallModel.findOne({ _id: id }, { function_name: 1 });
          if (functionDetails) childFunctionData.push(functionDetails);
        }
      }
      childBridge.function_data = childFunctionData;

      const filteredBridge = Object.fromEntries(
        Object.entries(filterBridge(childBridge)?.bridge).filter(([k, v]) => v !== null && k !== "connected_agents")
      );

      if (childBridge.connected_agents && Object.keys(childBridge.connected_agents).length > 0) {
        const childAncestors = new Set([...ancestorIds, agentBridgeId]);
        filteredBridge.child_agents = await buildConnectedAgents(childBridge.connected_agents, childAncestors);
      }

      result[key] = {
        description: agent.description,
        bridge_id: agentBridgeId,
        variables: agent.variables || {},
        bridge_details: filteredBridge
      };
    }
    return result;
  };

  if (bridge.connected_agents && Object.keys(bridge.connected_agents).length > 0) {
    bridge.child_agents = await buildConnectedAgents(bridge.connected_agents, new Set([agent_id]));
  }
  delete bridge.connected_agents;

  // Save the template
  const template = await templateService.saveTemplate(bridge, templateName);

  res.locals = {
    success: true,
    result: template
  };
  req.statusCode = 200;
  return next();
};

const createAgentFromTemplateController = async (req, res, next) => {
  try {
    const { template_id } = req.params;
    const org_id = req.profile.org.id;
    const user_id = req.profile.user.id;
    const agentType = req.body.bridgeType || "api";
    const meta = req.body.meta || null;

    const template_data = await ConfigurationServices.gettemplateById(template_id);
    if (!template_data) {
      res.locals = { success: false, message: "Template not found" };
      req.statusCode = 404;
      return next();
    }

    const template_content = JSON.parse(template_data.template);
    const all_agent = await ConfigurationServices.getAgentsByUserId(org_id);

    let name = template_data.templateName;
    let service = template_content?.service;
    let type = template_content?.configuration?.type;
    let prompt = template_content?.configuration?.prompt;

    const nameSlugData = getUniqueNameAndSlug(name, all_agent);
    const slugName = nameSlugData.slugName;
    name = nameSlugData.name;

    let model_data = { ...(template_content?.configuration || {}) };
    model_data.type = model_data.type || type;
    model_data.response_format = model_data.response_format || { type: "default", cred: {} };
    if (model_data.is_rich_text === undefined) model_data.is_rich_text = false;
    model_data.prompt = model_data.prompt || prompt;

    const fall_back = template_content?.fall_back || { is_enable: true, service: "ai_ml", model: "gpt-oss-120b" };
    const template_fields = ["variables_state", "built_in_tools", "gpt_memory_context", "user_reference", "bridge_summary", "agent_variables"];
    const template_values = {};
    for (const field of template_fields) {
      if (template_content[field] !== undefined) template_values[field] = template_content[field];
    }

    const result = await ConfigurationServices.createAgent({
      configuration: model_data,
      name,
      slugName,
      service,
      bridgeType: ["api", "chatbot"].includes(template_content?.bridgeType) ? template_content.bridgeType : agentType,
      org_id,
      gpt_memory: true,
      user_id,
      fall_back,
      bridge_status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      meta,
      ...template_values
    });

    const create_version = await agentVersionDbService.createAgentVersion(result.bridge);
    await ConfigurationServices.updateAgent(result.bridge._id.toString(), { versions: [create_version._id.toString()] });

    all_agent.push({ name, slugName });

    const parent_function_ids = normalizeFunctionIds(template_content?.function_ids);
    if (parent_function_ids.length > 0) {
      const cloned_function_ids = await cloneFunctionsForAgent(parent_function_ids, org_id, result.bridge._id.toString());
      if (cloned_function_ids.length > 0) {
        const functionObjectIds = cloned_function_ids.map((fid) => new ObjectId(fid));
        await ConfigurationServices.updateAgent(result.bridge._id.toString(), { function_ids: functionObjectIds });
        await ConfigurationServices.updateAgent(null, { function_ids: functionObjectIds }, create_version._id.toString());
      }
    }

    const createdAgentsMap = new Map();
    const rootBridgeId = template_content._id?.toString?.() || template_content._id;
    if (rootBridgeId) {
      createdAgentsMap.set(rootBridgeId, result.bridge._id.toString());
    }

    const createChildAgentsRecursively = async (child_agents_map, parent_bridge_id, parent_version_id, ancestorIds = new Set()) => {
      if (!child_agents_map || Object.keys(child_agents_map).length === 0) return;
      const connected_agents = {};

      for (const [agent_name, child_agent] of Object.entries(child_agents_map)) {
        const templateBridgeId = child_agent?.bridge_id?.toString?.() || child_agent?.bridge_id;
        const cycleKey = templateBridgeId || agent_name;

        if (ancestorIds.has(cycleKey)) {
          const existingBridgeId = createdAgentsMap.get(cycleKey);
          if (existingBridgeId) {
            connected_agents[agent_name] = {
              description: child_agent?.description,
              variables: child_agent?.variables || {},
              bridge_id: existingBridgeId
            };
          }
          continue;
        }

        const child_details = child_agent?.bridge_details;
        if (!child_details || Object.keys(child_details).length === 0) continue;

        const childNameSlug = getUniqueNameAndSlug(agent_name, all_agent);
        const child_model_data = { ...(child_details.configuration || {}) };
        child_model_data.type = child_model_data.type || type;
        child_model_data.response_format = child_model_data.response_format || { type: "default", cred: {} };
        if (child_model_data.is_rich_text === undefined) child_model_data.is_rich_text = false;
        child_model_data.prompt = child_model_data.prompt || prompt;

        let child_service = child_details.service || service;
        const child_template_values = {};
        for (const field of template_fields) {
          if (child_details[field] !== undefined) child_template_values[field] = child_details[field];
        }

        const child_result = await ConfigurationServices.createAgent({
          configuration: child_model_data,
          name: childNameSlug.name,
          slugName: childNameSlug.slugName,
          service: child_service,
          bridgeType: ["api", "chatbot"].includes(child_details.bridgeType) ? child_details.bridgeType : agentType,
          org_id,
          gpt_memory: true,
          user_id,
          fall_back,
          bridge_status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...child_template_values
        });

        const child_version = await agentVersionDbService.createAgentVersion(child_result.bridge);
        await ConfigurationServices.updateAgent(child_result.bridge._id.toString(), { versions: [child_version._id.toString()] });
        all_agent.push({ name: childNameSlug.name, slugName: childNameSlug.slugName });
        createdAgentsMap.set(cycleKey, child_result.bridge._id.toString());

        const child_function_ids = normalizeFunctionIds(child_details.function_ids);
        if (child_function_ids.length > 0) {
          const cloned_function_ids = await cloneFunctionsForAgent(child_function_ids, org_id, child_result.bridge._id.toString());
          if (cloned_function_ids.length > 0) {
            const functionObjectIds = cloned_function_ids.map((fid) => new ObjectId(fid));
            await ConfigurationServices.updateAgent(child_result.bridge._id.toString(), { function_ids: functionObjectIds });
            await ConfigurationServices.updateAgent(null, { function_ids: functionObjectIds }, child_version._id.toString());
          }
        }

        if (child_details.child_agents && Object.keys(child_details.child_agents).length > 0) {
          const childAncestors = new Set([...ancestorIds, cycleKey]);
          await createChildAgentsRecursively(
            child_details.child_agents,
            child_result.bridge._id.toString(),
            child_version._id.toString(),
            childAncestors
          );
        }

        connected_agents[agent_name] = {
          description: child_agent?.description,
          variables: child_agent?.variables || {},
          bridge_id: child_result.bridge._id.toString()
        };
      }

      if (Object.keys(connected_agents).length > 0) {
        await ConfigurationServices.updateAgent(parent_bridge_id, { connected_agents });
        await ConfigurationServices.updateAgent(null, { connected_agents }, parent_version_id);
      }
    };

    if (template_content?.child_agents && Object.keys(template_content.child_agents).length > 0) {
      const rootAncestorIds = new Set(rootBridgeId ? [rootBridgeId] : []);
      await createChildAgentsRecursively(template_content.child_agents, result.bridge._id.toString(), create_version._id.toString(), rootAncestorIds);
    }

    const updated_agent_result = await ConfigurationServices.getAgentsWithTools(result.bridge._id.toString(), org_id);

    res.locals = {
      success: true,
      message: "Agent created from template successfully",
      agent: updated_agent_result.bridges
    };
    req.statusCode = 200;

    return next();
  } catch (e) {
    res.locals = { success: false, message: "Error creating agent from template: " + e.message };
    req.statusCode = 400;
    return next();
  }
};

export default {
  allTemplates,
  createTemplate,
  createAgentFromTemplateController
};
