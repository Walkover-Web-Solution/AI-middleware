import configurationService from "../../db_services/ConfigurationServices.js";
import helper from "../../services/utils/helper.js";
import token from "../../services/commonService/generateToken.js";
import ModelsConfig from "../../configs/modelConfiguration.js";
const getConfiguration = async (configuration, service, bridge_id, api_key, template_id = null) => {
  let RTLayer = false;
  let bridge;
  const result = await configurationService.getBridges(bridge_id);
  if (!result.success) {
    return {
      success: false,
      error: "bridge_id does not exist"
    };
  }
  configuration = configuration ? configuration : result?.bridges?.configuration;
  service = service || (result?.bridges?.service ? result.bridges.service.toLowerCase() : "");
  api_key = api_key ? api_key : helper.decrypt(result?.bridges?.apikey);
  RTLayer = configuration?.RTLayer ? true : false;
  bridge = result?.bridges;
  service = service ? service.toLowerCase() : "";

  let templateContent = template_id ? await configurationService.gettemplateById(template_id) : null;
  return {
    success: true,
    configuration: configuration,
    bridge: bridge,
    service: service,
    apikey: api_key,
    RTLayer: RTLayer,
    template: templateContent?.template
  };
};
const filterDataOfBridgeOnTheBaseOfUI = (result, bridge_id, update = true) => {
  const configuration = result?.bridges?.configuration;
  const type = result.bridges.configuration?.type ? result.bridges.configuration.type : '';
  const model = configuration?.model ? configuration.model : '';
  const modelname = model.replaceAll("-", "_").replaceAll(".", "_");
  const modelfunc = ModelsConfig[modelname];
  let modelConfig = modelfunc().configuration;
  for (const key in modelConfig) {
    if (Object.prototype.hasOwnProperty.call(configuration, key)) {
      modelConfig[key].default = configuration[key];
    }
  }
  let customConfig = modelConfig;
  for (const keys in configuration) {
    if (keys != "name" && keys != "type") {
      customConfig[keys] = modelConfig[keys] ? customConfig[keys] : configuration[keys];
    }
  }

  if (configuration?.max_tokens > modelConfig?.max_tokens?.max) {
    configuration.max_tokens = modelConfig.max_tokens.default;
  }

  result.bridges.apikey = helper.decrypt(result.bridges.apikey);
  if (update) {
    const embed_token = token.generateToken({ payload: { org_id: process.env.ORG_ID, project_id: process.env.PROJECT_ID, user_id: bridge_id }, accessKey: process.env.Access_key });
    result.bridges.embed_token = embed_token;
  }
  result.bridges.type = type;
  result.bridges.configuration = customConfig;
};
export {
  getConfiguration,
  filterDataOfBridgeOnTheBaseOfUI
};
