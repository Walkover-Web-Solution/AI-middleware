import cron from 'node-cron';
import moveDataRedisToMongodb from '../controllers/movedataRedistoMongodb.js';
import { collectionNames, radis_pattern } from '../configs/constant.js';

const initializeDailyUpdateCron = () => {
  cron.schedule('*/15 * * * *', async () => {  // Every 15 minutes instead of every minute
    try {
      console.log('Running initializeDailyUpdateCron...');  
      await moveDataRedisToMongodb(radis_pattern.bridgeusedcost_, collectionNames.configuration, {
        bridge_usage: { type: 'number' }
      });
      await moveDataRedisToMongodb(radis_pattern.folderusedcost_, collectionNames.Folder, {
        folder_usage: { type: 'number' }
      });
      await moveDataRedisToMongodb(radis_pattern.apikeyusedcost_, collectionNames.ApikeyCredentials, {
        apikey_usage: { type: 'number' }
      });
      
    } catch (error) {
      console.error('Error running initializeDailyUpdateCron:', error);
    }
  });
};

export default initializeDailyUpdateCron;
