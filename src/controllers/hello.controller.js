import ConfigurationServices from "../db_services/configuration.service.js";
import { subscribeSchema } from "../validation/joi_validation/bridge.validation.js";
import modelConfigService from "../db_services/modelConfig.service.js";

export const subscribe = async (req, res, next) => {
  // Validate request body
  const { ispublic } = req.chatBot;
  let data = {};

  if (!ispublic) {
    const { error, value } = subscribeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => detail.message)
      });
    }
    const { slugName, versionId } = value;
    const { org } = req.profile;
    data = await ConfigurationServices.getAgentBySlugname(org.id, slugName, versionId);
  } else {
    const { slugName: url_slugName } = req.body;
    data = await ConfigurationServices.getAgentByUrlSlugname(url_slugName);
  }
  const model = data?.modelConfig?.model;
  const service = data?.service;
  const modelConfig = await modelConfigService.getModelConfigsByNameAndService(model, service);
  const vision = modelConfig[0]?.validationConfig?.vision;
  const files = modelConfig[0]?.validationConfig?.files;
  const services = data?.apikey_object_id ? Object.keys(data?.apikey_object_id) : [];
  const mode = [];
  files && mode.push("files");
  vision && mode.push("vision");

  res.locals = {
    mode,
    supportedServices: services
  };

  req.statusCode = 200;
  return next();
};
