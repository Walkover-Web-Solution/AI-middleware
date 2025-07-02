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
import { extractUniqueUrls, getChunkingType, getFileFormatByUrl, getNameAndDescByAI, getScriptId } from '../utils/ragUtils.js';
import { sendAlert } from '../services/utils/utilityService.js';
import { ResponseSender } from '../services/utils/customRes.js';
import { sendRagUpdates } from '../services/alertingService.js';

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
                sendRagUpdates(data.orgId, clones, 'create');
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
                await generateNameAndDescByAI(ragData);
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
            await rag_parent_data.updateDocumentsByQuery(updateCondition, {metadata: { status: pipelineStatus }}).catch(error => console.log(error));
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
        if(msg.retryCount > 1) {
            if(msg.event === 'load' && ragData?.source?.nesting?.level > 0){
                rag_parent_data.deleteDocumentById(resourceId);
                sendRagUpdates(ragData?.org_id, [ragData], 'delete');
            }
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
    const nestedDocs = await rag_parent_data.getDocumentsByQuery({ 'source.nesting.parentDocId': resourceId });
    await Promise.all([
        rag_parent_data.update(resourceId, toUpdate), 
        rag_parent_data.removeChunksByDocId(resourceId), 
        rag_parent_data.deleteDocumentsByQuery({ 'source.nesting.parentDocId': resourceId })
    ]);
    sendRagUpdates(ragParentData.org_id, nestedDocs, 'delete');
    const queuePayload = {
      resourceId,
      content,
      orgId: ragParentData.org_id,
      userId: ragParentData.user_id,
      fileFormat: ragParentData.source.fileFormat,
      chunkingType: ragParentData.chunking_type,
    };
    processNestedLinks(content, ragParentData).catch(err => logger.error('Error processing nested links', err));
    await queue.publishToQueue(QUEUE_NAME, { event :"chunk" , data : queuePayload })
}

async function processNestedLinks(content, ragParentData){
    if(ragParentData.source?.nesting?.level >= 1 || !ragParentData.source?.nesting?.enabled) return;
    const urls = extractUniqueUrls(content);
    const documents = await Promise.allSettled(urls.map(async url => {
        const fileFormat = getFileFormatByUrl(url);
        return {
            source: {
                type: 'url', 
                fileFormat, 
                data: {
                    url, type: 'url'
                }, 
                nesting: {
                    level: ragParentData.source.nesting.level + 1, 
                    parentDocId: ragParentData.source.nesting.parentDocId || ragParentData._id
                }
            },
            user_id: ragParentData.user_id,
            org_id: ragParentData.org_id
        }
    }));
    
    const insertedDocuments = await rag_parent_data.insertMany(documents.filter(d => d.status === 'fulfilled').map(d => d.value));
    for(const document of insertedDocuments) {
        await queue.publishToQueue(QUEUE_NAME, { event: "load", data: { url: document.source.data.url, resourceId: document._id } });
    }
}

async function generateNameAndDescByAI(ragData){
    if(ragData.name && ragData.description) return;
    let { name, description } = await getNameAndDescByAI(ragData.content.substring(0, 10_000));
    name = ragData.name || name;
    description = ragData.description || description;
    const newDoc = await rag_parent_data.update(ragData._id, { name, description });
    sendRagUpdates(ragData.org_id, [newDoc], 'create');
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