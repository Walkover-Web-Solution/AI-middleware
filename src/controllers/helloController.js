import {
    getWidgetInfo,
    getSocketJwt,
    getChannelList
} from '../utils/helloUtils.js';
import ConfigurationServices from '../db_services/ConfigurationServices.js';
import { createThread } from '../services/threadService.js';
import ModelsConfig from '../configs/modelConfiguration.js';
// import helloService from '../db_services/helloService.js';
export const subscribe = async (req, res, next) => {
    const { slugName, threadId: thread_id, versionId } = req.body;
    let hello_id = req.body.helloId
    const { org_id } = req.profile;
    let data = {};
    if(!hello_id)  data = (await ConfigurationServices.getBridgeBySlugname(org_id, slugName,versionId));
    try {
        await createThread({
            display_name: thread_id,
            thread_id,
            org_id: org_id.toString(),
            sub_thread_id: thread_id
        });
    } catch (error) {
       console.log(error) 
    }
    const model = data?.modelConfig?.configuration?.model
    const modelName = Object.keys(ModelsConfig).find(key => ModelsConfig[key]().configuration.model.default === model);
    const vision = modelName ? ModelsConfig[modelName]().configuration.vision : null;

    try {
        if(hello_id ?? false)
            {
                const [widgetInfo, ChannelList] = await Promise.all([
                    getWidgetInfo(hello_id),
                    getChannelList(hello_id, thread_id),
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
                res.locals = {
                    widgetInfo: { ...widgetInfo, helloId: hello_id},
                    Jwt: socketJwt,
                    ChannelList,
                    mode : ['human']
                }
            }
        else{
            res.locals = {
                mode : [],
                vision:vision ? true : false
            }
        }
        req.statusCode = 200;
        return next();
    } catch (error) {
        console.error('Error in hello subscribe route:', error);
        throw new Error('Internal Server Error', error.message);
    }
}; 