import rabbitmqService from './rabbitmq.js';
import logger from '../logger.js';
import { configDotenv } from 'dotenv';

let rabbitConnection;
let rabbitChannel;
configDotenv();
const RABBIT_CONNECTION_STRING = process.env.QUEUE_CONNECTIONURL || '';

class RabbitMqProducer {
  static instance;
  
  constructor() {
    logger.info('[PRODUCER] Listening for connection...');
    rabbitmqService(RABBIT_CONNECTION_STRING).on('connect', async (connection) => {
      logger.info('[PRODUCER] Connection received...');
      rabbitConnection = connection;
      logger.info('[PRODUCER] Creating channel...');
      rabbitChannel = await rabbitConnection.createChannel();
    });
  }

  static getSingletonInstance() {
    RabbitMqProducer.instance ||= new RabbitMqProducer();
    return RabbitMqProducer.instance;
  }

  async publishToQueue(queueName, payload) {
    try {
      logger.debug('[PRODUCER] Preparing payload...');
      payload = (typeof payload === 'string') ? payload : JSON.stringify(payload);
      const payloadBuffer = Buffer.from(payload);
      logger.debug(`[PRODUCER] Asserting '${queueName}' queue...`);
      rabbitChannel.assertQueue(queueName, { durable: true });
      logger.debug(`[PRODUCER] Producing to '${queueName}' queue...`);
      await rabbitChannel.sendToQueue(queueName, payloadBuffer);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}

export default RabbitMqProducer.getSingletonInstance();


