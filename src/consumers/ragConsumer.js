import producer from '../services/queue.js';
// import rtlayer from '../config/rtlayer';
// import { EventSchema, VERSION } from '../type/rag';
// import { delay } from '../utility';
import { DocumentLoader } from '../services/document-loader/index.js';
// import ResourceService from '../dbservices/resource';
import rag_parent_data from '../db_services/rag_parent_data.js';

import { Doc, MongoStorage, OpenAiEncoder, PineconeStorage } from '../services/document.js';
import logger from '../logger.js';
import queue from '../services/queue.js';
import { getChunkingType, getScriptId } from '../utils/ragUtils.js';
import { sendAlert } from '../services/utils/utilityService.js';
import { ResponseSender } from '../services/utils/customRes.js';

const QUEUE_NAME = process.env.RAG_QUEUE || 'rag-queue';
const rtLayer = new ResponseSender();

async function processMsg(message, channel) {

    let resourceId = '';
    const msg = JSON.parse(message.content);
    let updateCondition;
    let ragData;

    try {
        // const { version, event, data } = EventSchema.parse(msg);
        const { event, data } = msg;
        resourceId = data.resourceId;
        updateCondition = {_id : resourceId};
        console.log(`Event: ${event}` + `: ${resourceId}`);
        let pipelineStatus = null;
        ragData = await rag_parent_data.getDocumentById(resourceId);
        
        switch (event) {
            case 'load_multiple': 
                // BUG: On Refreshing, what if he removed the documents that were previously selected.
                const multiLoader = new DocumentLoader();
                const files = await multiLoader.getContent(data.url);
                const fileIds = Object.keys(files);
                const fileContents = Object.values(files);
                const parentData = await rag_parent_data.update(data.resourceId, { 'source.fileId': fileIds[fileIds.length-1] }); // We need to get the documents in the order wer are getting content. FIX THIS WHEN IMPLEMENTING REFRESH DOCUMENT
                const clones = await rag_parent_data.insertMany(
                    Array(fileIds.length - 1)
                        .fill()
                        .map((_, idx) => ({ ...parentData, _id: undefined, source: { ...parentData.source, fileId: fileIds[idx] } }))
                );
                const parentDatas = [...clones, parentData];

                for (let parent of parentDatas){
                    await processContent(fileContents.shift(), parent, parent._id.toString()); 
                }
                updateCondition = {'source.scriptId': getScriptId(data.url)}
                pipelineStatus = "loaded";
                break;
            case 'load':
                const loader = new DocumentLoader();
                const content = await loader.getContent(data.url, {fileId: ragData.source?.fileId});
                await processContent(content, ragData, resourceId);
                pipelineStatus = "loaded";
                break;
            case 'delete': {
                const doc = new Doc(data.resourceId );
                await doc.delete(new PineconeStorage(), data.orgId); // WARNING: Pinecone delete is dependent on id from mongo
                await doc.delete(new MongoStorage());
                pipelineStatus = "deleted";
                break;
            }
            case 'chunk': {
                const doc = new Doc(data.resourceId, data.content, data.fileFormat, { orgId: data.orgId, userId: data.userId });
                const chunk = await doc.chunk(512, 50, data.chunkingType, data.resourceId); // FIX: chunk size hardcoded. 
                await chunk.save(new MongoStorage());
                await chunk.encode(new OpenAiEncoder());
                try {
                    await chunk.save(new PineconeStorage(),data.orgId);
                } catch (error) {
                    chunk.delete(new MongoStorage());
                    throw error;
                }
                // await updateDescription(data?.resourceId, data?.content).catch(error => logger.error(error));
                pipelineStatus = "chunked";
                break;
            }
            case 'update':
                {
                    // TODO: Change the visibility of the resource
                    break;
                }
            default:
                {
                    logger.error(`[message] Unknown event type: ${event}`);
                    throw new Error(`Unknown event type: ${event}`);
                    // break;
                }
        }
        if (pipelineStatus) {
            await rag_parent_data.updateDocumentsByQuery(updateCondition, { status: pipelineStatus }).catch(error => console.log(error));
            await rtLayer.sendResponse({
                rtlLayer: true,
                reqBody: {
                    id: resourceId, status: pipelineStatus,
                    rtlOptions: {
                        channel: `rag_${ragData?.org_id}${ragData?.user_id ? `-${ragData?.user_id}` : ''}`
                    }
                }
            }).catch(error => logger.error(error));
        }
        channel.ack(message);
    } catch (error) {
        console.error("Error in processing Message", error);
        // TODO: Add error message to the failed message
        if(msg.retryCount > 2) {
            producer.publishToQueue(QUEUE_NAME + "_FAILED", message.content.toString());
        }else{
            sendAlert('ERROR IN RAG CONSUMER', error, resourceId)
            producer.publishToQueue(QUEUE_NAME, JSON.stringify({
                ...msg, 
                error: error.stack, 
                retryCount: (msg.retryCount || 0) + 1,
            }));
        }
        if (resourceId) {
            await rag_parent_data.updateDocumentsByQuery(updateCondition, { metadata: { status: 'error', message: error?.message }}).catch(error => console.log(error));
            await rtLayer.sendResponse({
                rtlLayer: true,
                reqBody: {
                    id: resourceId, status: 'error', message: error?.message, 
                    rtlOptions: {
                        channel: `rag_${ragData?.org_id}${ragData?.user_id ? `-${ragData?.user_id}` : ''}`
                    }
                }
            }).catch(error => logger.error(error));
        }
        logger.error(`[message] Error processing rag message: ${error.message}`);
        channel.ack(message);
    }

}


async function processContent(content, ragParentData, resourceId){
    const toUpdate = { content }
    
    if (ragParentData.chunking_type === 'auto'){
        if(ragParentData.source?.fileFormat !== 'csv'){
            toUpdate.chunking_type = await getChunkingType(content);
            ragParentData.chunking_type = toUpdate.chunking_type
        }
        toUpdate.is_chunking_type_auto = true
    }

    const oldContent = ragParentData.content;
    // TODO: Can we change the final status as "done"
    if(oldContent === content || oldContent?.equals?.(content) )  {
        return;
    }
    await Promise.all([
        rag_parent_data.update(resourceId, toUpdate), 
        rag_parent_data.removeChunksByDocId(resourceId)
    ])
    const queuePayload = {
      resourceId,
      content,
      orgId: ragParentData.org_id,
      userId: ragParentData.user_id,
      fileFormat: ragParentData.source.fileFormat,
      chunkingType: ragParentData.chunking_type,
    };
    await queue.publishToQueue(QUEUE_NAME, { event :"chunk" , data : queuePayload })

}
export default {
    queueName: QUEUE_NAME,
    process: processMsg,
    batchSize: 1
}
// this.queueName = obj.queueName;
// this.processor = obj.ragConsume;
// this.bufferSize = obj.batchSize || 1; // Default value if prefetch is not provided
// this.logInInterval = obj.logInInterval || null;