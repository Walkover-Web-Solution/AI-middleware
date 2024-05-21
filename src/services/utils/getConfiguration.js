import configurationService from "../../db_services/ConfigurationServices.js";
import helper from "../../services/utils/helper.js";
import token from "../../services/commonService/generateToken.js";
import ModelsConfig from "../../configs/modelConfiguration.js";
const getConfiguration = async (configuration, service, bridge_id, api_key) => {
  let RTLayer = false;
  let bridge;
  if (!configuration) {
    const result = await configurationService.getBridges(bridge_id);
    if (!result.success) {
      return {
        success: false,
        error: "bridge_id does not exist"
      };
    }
    configuration = result?.bridges?.configuration;
    service = result?.bridges?.service ? result.bridges.service.toLowerCase() : "";
    api_key = api_key ? api_key : helper.decrypt(result?.bridges?.apikey);
    RTLayer = configuration?.RTLayer ? true : false;
    bridge = result?.bridges;
  }
  service = service ? service.toLowerCase() : "";
  return {
    success: true,
    configuration: configuration,
    bridge: bridge,
    service: service,
    apikey: api_key,
    RTLayer: RTLayer
  };
};
const filterDataOfBridgeOnTheBaseOfUI = (result, bridge_id) => {
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
  result.bridges.apikey = helper.decrypt(result.bridges.apikey);
  const embed_token = token.generateToken(bridge_id);
  result.bridges.embed_token = embed_token;
  result.bridges.type = type;
  result.bridges.configuration = customConfig;
};
export {
  getConfiguration,
  filterDataOfBridgeOnTheBaseOfUI
};