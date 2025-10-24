import cron from 'node-cron';
import moveDataRedisToMongodb from '../controllers/movedataRedistoMongodb.js';
import { collectionNames, radis_pattern } from '../configs/constant.js';

const initializeDailyUpdateCron = () => {
  cron.schedule('* 2 * * *', async () => {
    try {
      console.log('Running initializeDailyUpdateCron...');   
      await moveDataRedisToMongodb(radis_pattern.apikeylastused_, collectionNames.ApikeyCredentials, {
        last_used: { type: 'date' }
      });
      await moveDataRedisToMongodb(radis_pattern.bridgelastused_, collectionNames.configuration, {
        last_used: { type: 'date' }
      });
    } catch (error) {
      console.error('Error running initializeDailyUpdateCron:', error);
    }
  });
};

export default initializeDailyUpdateCron;
