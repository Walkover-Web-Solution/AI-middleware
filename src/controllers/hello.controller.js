import { getWidgetInfo, getSocketJwt, getChannelList } from "../utils/hello.utils.js";
import ConfigurationServices from "../db_services/configuration.service.js";
import { subscribeSchema } from "../validation/joi_validation/bridge.validation.js";
import modelConfigService from "../db_services/modelConfig.service.js";
// import helloService from '../db_services/helloService.js';
export const subscribe = async (req, res, next) => {
  // Validate request body
  const { ispublic } = req.chatBot;
  let data = {};
  let thread_id;
  if (!ispublic) {
    const { error, value } = subscribeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }
    const { slugName, versionId } = value;
    let Hello_id = value.helloId;
    const { org_id } = req.profile;
    if (!Hello_id) data = await ConfigurationServices.getAgentBySlugname(org_id, slugName, versionId);
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
  if (data?.hello_id?.hello_id ?? false) {
    const hello_id = data?.hello_id?.hello_id;
    const [widgetInfo, ChannelList] = await Promise.all([getWidgetInfo(hello_id), getChannelList(hello_id, thread_id)]);
    const socketJwt = await getSocketJwt(hello_id, ChannelList, false);

    // Check for errors
    if (widgetInfo.error || socketJwt.error || ChannelList.error) {
      // Handle errors accordingly
      console.error("Error in one of the promises:", {
        widgetInfoError: widgetInfo.error,
        socketJwtError: socketJwt.error,
        ChannelListError: ChannelList.error,
      });
      throw new Error("Error in one of the promises");
    }
    mode.push("human");
    res.locals = {
      widgetInfo: { ...widgetInfo, helloId: hello_id },
      Jwt: socketJwt,
      ChannelList,
      mode,
      files,
    };
  } else {
    res.locals = {
      mode,
    };
  }
  res.locals["supportedServices"] = services;
  req.statusCode = 200;
  return next();
};
