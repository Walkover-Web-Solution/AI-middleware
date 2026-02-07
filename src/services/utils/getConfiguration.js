import configurationService from "../../db_services/configuration.service.js";
import helper from "../../services/utils/helper.utils.js";

const getConfiguration = async (configuration, service, bridge_id, api_key, template_id = null) => {
  let RTLayer = false;
  let bridge;
  const result = await configurationService.getAgents(bridge_id);
  if (!result.success) {
    return {
      success: false,
      error: "bridge_id does not exist",
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
    template: templateContent?.template,
  };
};

function convertToTimestamp(dateTimeStr) {
  const dateObj = new Date(dateTimeStr);
  return dateObj.getTime();
}

export { getConfiguration, convertToTimestamp };
