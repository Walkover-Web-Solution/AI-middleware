import { new_agent_service } from "../configs/constant.js";
import { modelConfigDocument } from "../services/utils/loadModelConfigs.js";

const getAllServiceModelsController = async (req, res, next) => {
  const { service } = req.params;
  const service_lower = service.toLowerCase();

  if (!modelConfigDocument[service_lower]) {
    res.locals = {};
    req.statusCode = 200;
    return next();
  }

  const result = { chat: {}, "fine-tune": {}, reasoning: {}, image: {}, embedding: {} };
  const service_models = modelConfigDocument[service_lower];

  for (const [model_name, config] of Object.entries(service_models)) {
    if (config.status !== 1) continue;
    const type = config.validationConfig?.type || "chat";
    if (result[type]) {
      // Transform config to desired format
      const transformedConfig = {
        configuration: {
          model: config.configuration?.model || {
            field: "drop",
            default: model_name,
            level: 1,
          },
          additional_parameters: {},
        },
        validationConfig: config.validationConfig,
        outputConfig: config.outputConfig,
        org_id: null,
      };

      // Move all other configuration fields to additional_parameters
      if (config.configuration) {
        for (const [key, value] of Object.entries(config.configuration)) {
          if (key !== "model") {
            transformedConfig.configuration.additional_parameters[key] = value;
          }
        }
      }

      result[type][model_name] = transformedConfig;
    }
  }

  res.locals = result;
  req.statusCode = 200;
  return next();
};

const getAllServiceController = async (req, res, next) => {
  res.locals = {
    success: true,
    message: "Get all service successfully",
    services: {
      openai: { model: new_agent_service["openai"] },
      anthropic: { model: new_agent_service["anthropic"] },
      groq: { model: new_agent_service["groq"] },
      open_router: { model: new_agent_service["open_router"] },
      mistral: { model: new_agent_service["mistral"] },
      gemini: { model: new_agent_service["gemini"] },
      ai_ml: { model: new_agent_service["ai_ml"] },
      grok: { model: new_agent_service["grok"] },
    },
  };
  req.statusCode = 200;
  return next();
};

export default {
  getAllServiceModelsController,
  getAllServiceController,
};
