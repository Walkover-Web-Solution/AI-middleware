import producer from '../services/queue.js';
// import rtlayer from '../config/rtlayer';
// import { EventSchema, VERSION } from '../type/rag';
// import { delay } from '../utility';
import { DocumentLoader } from '../services/document-loader/index.js';
// import ResourceService from '../dbservices/resource';
import rag_parent_data from '../db_services/rag_parent_data.js';

import { Doc, MongoStorage, OpenAiEncoder, PineconeStorage } from '../services/document.js';
import logger from '../logger.js';


const QUEUE_NAME = process.env.RAG_QUEUE || 'rag';
async function processMsg(message, channel) {
    let resourceId = '';
    try {
        const msg = JSON.parse(message.content.toString());
        // const { version, event, data } = EventSchema.parse(msg);
        const { version, event, data } =msg;
        resourceId = data.resourceId;
        console.log(`Event: ${event}`);
        let pipelineStatus = null;
        switch (event) {
            case 'load':
                const loader = new DocumentLoader();
                const content = await loader.getContent(data.url);
                const { content: oldContent } = await rag_parent_data.getDocumentById(data.resourceId);
                // TODO: Can we change the final status as "done"
                if(oldContent === content)  {
                    pipelineStatus = "chunked";
                    break;
                }
                await rag_parent_data.update(data.resourceId, { content });
                pipelineStatus = "loaded";
                break;
            // case 'delete': {
            //     const doc = new Doc(data.resourceId);
            //     await doc.delete(new PineconeStorage()); // WARNING: Pinecone delete is dependent on id from mongo
            //     await doc.delete(new MongoStorage());
            //     pipelineStatus = "deleted";
            //     break;
            // }
            case 'chunk': {
                const doc = new Doc(data.resourceId, data.content, { public: data.public, agentId: data.agentId });
                const chunk = await doc.chunk(512, 50);
                await chunk.save(new MongoStorage());
                await chunk.encode(new OpenAiEncoder());
                try {
                    await chunk.save(new PineconeStorage());
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
            await ResourceService.updateMetadata(data.resourceId, { status: pipelineStatus }).catch(error => console.log(error));
            // await rtlayer.message(JSON.stringify({ id: data?.resourceId, status: pipelineStatus }), { channel: "resource" }).catch(error => logger.error(error));
        }
        channel.ack(message);
    } catch (error) {
        console.log(error);
        // TODO: Add error message to the failed message
        producer.publishToQueue(QUEUE_NAME + "_FAILED", message.content.toString());
        if (resourceId) {
            await ResourceService.updateMetadata(resourceId, { status: 'error', message: error?.message }).catch(error => console.log(error));
            // await rtlayer.message(JSON.stringify({ id: resourceId, status: 'error', message: error?.message }), { channel: "resource" }).catch(error => logger.error(error));
        }
        logger.error(`[message] Error processing message: ${error.message}`);
        channel.ack(message);
    }

}

export default {
    queue: QUEUE_NAME,
    processor: processMsg,
    batch: 1
}