import {
  getWidgetInfo,
  getSocketJwt,
  getChannelList
} from '../utils/helloUtils.js';
import ConfigurationServices from '../db_services/ConfigurationServices.js';
// import helloService from '../db_services/helloService.js';
export const subscribe = async (req, res, next) => {
  const { slugName, threadId:thread_id } = req.body;
  const { org_id } = req.profile;
  const {hello_id} = await ConfigurationServices.getBridgeBySlugname(org_id, slugName);
  
  try {

    const [widgetInfo, ChannelList] = await Promise.all([
      getWidgetInfo(hello_id),
      getChannelList(hello_id, thread_id)
    ]);
    const socketJwt = await getSocketJwt(hello_id, ChannelList, false);

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
    res.locals ={
        widgetInfo:{...widgetInfo,helloId: hello_id},
        Jwt: socketJwt,
        ChannelList
      }
    req.statusCode = 200;
    return next();
  } catch (error) {
    console.error('Error in hello subscribe route:', error);
    throw new Error('Internal Server Error', error.message);
  }
}; 