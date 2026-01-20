import logger from "../logger.js";
import queue from "../services/queue.service.js";

export async function pushLogInQueue(logData, queueName, max_retries = 2) {
  if (!Array.isArray(logData)) {
    logData = [logData];
  }
  for (const log of logData) {
    for (let i = 0; i < max_retries; i++) {
      try {
        await queue.publishToQueue(queueName || "", log || "Error in processing message");
        break;
      } catch (error) {
        if (i === max_retries - 1) {
          logger.info("Max retries reached, failed to send message.");
          logger.error(error);
        }
      }
    }
  }
}
