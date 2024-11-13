import {
  getWidgetInfo,
  getSocketJwt,
  getChannelList
} from '../utils/helloUtils.js';
import ConfigurationServices from '../db_services/ConfigurationServices.js';
import conversationDbService from "../db_services/conversationDbService.js";
import helloService from '../db_services/helloService.js';

export const subscribe = async (req, res) => {
  const { slugName, threadId:thread_id } = req.body;
  const { org_id } = req.profile;
  const {_id , hello_id} = await ConfigurationServices.getBridgeBySlugname(org_id, slugName);
  
  try {
    const clientResponse = await helloService.getOrCreateAnonymousClientId(thread_id, slugName, org_id, hello_id);
    
    if (!clientResponse.success) {
      return res.status(500).json({ error: clientResponse.error });
    }

    const anonymousClientId = {uuid:clientResponse.data};

    const [widgetInfo, socketJwt, ChannelList] = await Promise.all([
      getWidgetInfo(hello_id),
      getSocketJwt(hello_id, anonymousClientId, false),
      getChannelList(hello_id, anonymousClientId, false)
    ]);
    await conversationDbService.updateConversationMode(org_id, _id, thread_id);

    // Check for errors
    if (widgetInfo.error || socketJwt.error || ChannelList.error) {
      // Handle errors accordingly
      console.error('Error in one of the promises:', {
        widgetInfoError: widgetInfo.error,
        socketJwtError: socketJwt.error,
        ChannelListError: ChannelList.error,
      });
      throw new Error('Error in one of the promises');
    }
    res.status(200).json({
      widgetInfo,
      anonymousClientId,
      Jwt: socketJwt,
      ChannelList
    });
  } catch (error) {
    console.error('Error in hello subscribe route:', error);
    res.status(500).send('Internal Server Error');
  }
}; 