const configurationService = require("../../db_services/ConfigurationServices");
const getConfiguration = async (configuration,service,bridge_id) => {
    if (!configuration) {
        const result = await configurationService.getBridges(bridge_id);
        if (!result.success) {
            return {success:false,error:"bridge_id does not exist"}
        }
            configuration = result?.bridges?.configuration;
            service = configuration?.service?.toLowerCase();
    }
    return {success:true,configuration:configuration,service:service}
}

module.exports={getConfiguration}