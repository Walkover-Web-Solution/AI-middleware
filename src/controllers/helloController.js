import {
  getWidgetInfo,
  getSocketJwt,
  getChannelList
} from '../utils/helloUtils.js';
import ConfigurationServices from '../db_services/ConfigurationServices.js';
import helloService from '../db_services/helloService.js';

export const subscribe = async (req, res) => {
  const { org_id, slugName, thread_id } = req.body;
  const {hello_id} = await ConfigurationServices.getBridgeBySlugname(org_id, slugName);
  
  try {
    const clientResponse = await helloService.getOrCreateAnonymousClientId(thread_id, slugName, org_id, hello_id);
    
    if (!clientResponse.success) {
      return res.status(500).json({ error: clientResponse.error });
    }

    const anonymousClientId = {uuid:clientResponse.data};

    const widgetInfo = await getWidgetInfo(hello_id);
    const socketJwt = await getSocketJwt(hello_id, anonymousClientId, true);
    const ChannelList = await getChannelList(hello_id, anonymousClientId, true);

    console.log(widgetInfo, anonymousClientId, socketJwt, ChannelList);

    res.status(200).json({
      widgetInfo,
      anonymousClientId,
      Jwt: socketJwt,
      ChannelList,
    });
  } catch (error) {
    console.error('Error in hello subscribe route:', error);
    res.status(500).send('Internal Server Error');
  }
}; 