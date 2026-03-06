import templateService from "../db_services/template.service.js";
import configurationService from "../db_services/configuration.service.js";
import apiCallModel from "../mongoModel/ApiCall.model.js";
import { ObjectId } from "mongodb";

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
  const { bridge_id } = req.params;
  const { templateName } = req.body;

  if (!bridge_id) {
    throw new Error("bridge_id is required");
  }

  if (!templateName) {
    throw new Error("templateName is required");
  }

  // Get the bridge data
  const bridgeData = await configurationService.getAgents(bridge_id);
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
      if (!agentBridgeId || ancestorIds.has(agentBridgeId)) continue;

      const childBridgeData = await configurationService.getAgents(agentBridgeId);
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
    bridge.child_agents = await buildConnectedAgents(bridge.connected_agents, new Set([bridge_id]));
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

export default {
  allTemplates,
  createTemplate
};
