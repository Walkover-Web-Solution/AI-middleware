import logger from '../logger.js';
// import { sendAlert } from '../utility/alerting.js';
import { pushLogInQueue } from './queue-utility.js';

const QUEUE_NAME = process.env?.RAG_QUEUE_NAME;
const FAILED_BACKUP_QUEUE = process.env?.RAG_QUEUE_NAME + '-failed';

const BATCH_SIZE = parseInt(process.env?.RAG_QUEUE_BATCH_SIZE, 10);
const INTERVAL_TIME = parseInt(process.env?.RAG_QUEUE_INTERVAL_TIME, 10);

const ragBatch = [];
let inInterval = false;
let inConsumer = false;

async function processRagBatch(channel) {
  let elementTobeAck;
  let messages = [];
  try {
    messages = ragBatch.map((msg) => msg.content?.toString());
    logger.info('Processing RAG batch');
    elementTobeAck = ragBatch[messages.length - 1];
    // Process RAG messages here
    // Add your RAG processing logic
    
    await channel.ack(elementTobeAck, true);
    ragBatch.splice(0, messages.length);
  } catch (error) {
    try {
      await channel.ack(elementTobeAck, true);
      await pushLogInQueue(error.failedMessages, FAILED_BACKUP_QUEUE);
      ragBatch.splice(0, messages.length);
    } catch (error) {
    //   sendAlert(error.message, 'RAG consumer retry failed', 'RAG_RETRY_FAILED');
        logger.error('Failed to process RAG batch', error);
    }
  }
}

async function processInInterval(channel) {
  setInterval(async () => {
    if (inConsumer || inInterval) {
      return;
    }
    inInterval = true;
    if (!channel || !QUEUE_NAME) {
      logger.error(`${QUEUE_NAME} is not defined or ${channel} is not connected}`);
      return;
    }
    if (ragBatch?.length > 0 && ragBatch?.length < BATCH_SIZE) {
      await processRagBatch(channel);
    }
    inInterval = false;
  }, INTERVAL_TIME);
}

async function ragConsumer(message, channel) {
  ragBatch.push(message);
  if (inInterval) {
    return;
  }
  try {
    inConsumer = true;
    if (ragBatch.length < BATCH_SIZE) {
      inConsumer = false;
      return;
    }
    await processRagBatch(channel);
  } catch (err) {
    logger.error(err);
  }
  inConsumer = false;
}

export default {
  ragConsume: ragConsumer,
  batchSize: BATCH_SIZE,
  queueName: QUEUE_NAME,
  logInInterval: processInInterval,
};
