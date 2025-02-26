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


const QUEUE_NAME = process.env.RAG_QUEUE || 'rag-queue';
async function processMsg(message, channel) {

    let resourceId = '';
    const msg = JSON.parse(message.content);
    try {
        // const { version, event, data } = EventSchema.parse(msg);
        const { version, event, data } = msg;
        resourceId = data.resourceId;
        console.log(`Event: ${event}` + `: ${resourceId}`);
        let pipelineStatus = null;
        
        switch (event) {
            case 'load':
                console.log(data,"Data");
                const loader = new DocumentLoader();
                const content = await loader.getContent(data.url);
                const data1 = await rag_parent_data.getDocumentById(data.resourceId);
                const oldContent = data1.content;
                // TODO: Can we change the final status as "done"
                if(oldContent === content || oldContent?.equals(content) )  {
                    pipelineStatus = "chunked";
                    break;
                }
                await rag_parent_data.update(data.resourceId, { content });
                const queuePayload =  { resourceId,
                    content,orgId :data1.org_id, 
                    userId : data1.user_id,
                     fileFormat: data1.source.fileFormat,
                     chunkingType :data1.chunking_type
                    }
                await queue.publishToQueue(QUEUE_NAME, { event :"chunk" , data : queuePayload })
                pipelineStatus = "loaded";
                break;
            case 'delete': {
                const doc = new Doc(data.resourceId );
                await doc.delete(new PineconeStorage(),data.orgId); // WARNING: Pinecone delete is dependent on id from mongo
                await doc.delete(new MongoStorage());
                pipelineStatus = "deleted";
                break;
            }
            case 'chunk': {
                const doc = new Doc(data.resourceId, data.content, data.fileFormat, { orgId: data.orgId, userId: data.userId });
                const chunk = await doc.chunk(512, 50,data.chunkingType,data.resourceId);
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
        // if (pipelineStatus) {
        //     await ResourceService.updateMetadata(data.resourceId, { status: pipelineStatus }).catch(error => console.log(error));
        //     // await rtlayer.message(JSON.stringify({ id: data?.resourceId, status: pipelineStatus }), { channel: "resource" }).catch(error => logger.error(error));
        // }
        channel.ack(message);
    } catch (error) {
        // TODO: Add error message to the failed message
        if(msg.retryCount > 2) {
            console.error("error in rag consumer",error);
            producer.publishToQueue(QUEUE_NAME + "_FAILED", message.content.toString());
        }else{
            producer.publishToQueue(QUEUE_NAME, JSON.stringify({
                ...msg, 
                error: error.stack, 
                retryCount: (msg.retryCount || 0) + 1,
            }));
        }
        // if (resourceId) {
        //     await ResourceService.updateMetadata(resourceId, { status: 'error', message: error?.message }).catch(error => console.log(error));
        //     // await rtlayer.message(JSON.stringify({ id: resourceId, status: 'error', message: error?.message }), { channel: "resource" }).catch(error => logger.error(error));
        // }
        logger.error(`[message] Error processing rag message: ${error.message}`);
        channel.ack(message);
    }

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