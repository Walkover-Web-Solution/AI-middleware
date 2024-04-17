const configurationService = require("../../db_services/ConfigurationServices");
const helper = require("../../services/utils/helper");
const getConfiguration = async (configuration,service,bridge_id,api_key) => {
    let RTLayer = false;
    let bridge;
    if (!configuration) {
        const result = await configurationService.getBridges(bridge_id);
        if (!result.success) {
            return {success:false,error:"bridge_id does not exist"}
        }
            configuration = result?.bridges?.configuration;
            service = result?.bridges?.service ? result.bridges.service.toLowerCase() : "";
            api_key=api_key?api_key:helper.decrypt(result?.bridges?.apikey);
            RTLayer = configuration?.RTLayer ? true:false;
            bridge=result?.bridges;

    }
    service=service?service.toLowerCase():"";
    return {success:true,configuration:configuration,bridge:bridge,service:service,apikey:api_key,RTLayer:RTLayer}
}

module.exports={getConfiguration}