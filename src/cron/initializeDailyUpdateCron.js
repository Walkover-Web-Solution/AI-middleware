import cron from 'node-cron';

import bridgeAnalysisController from '../controllers/bridgeAnalysisController.js';
const initializeDailyUpdateCron = () => {
  console.log('Initializing Daily Update Cron - will run daily at 7:00 AM IST...');
  
  cron.schedule('0 7 * * *', async () => {  // Every day at 7:00 AM IST
// cron.schedule('* * * * *', async () => {  // For testing - every minute 
    try {
      console.log(`[${new Date().toISOString()}] Running initializeDailyUpdateCron...`);  
     await bridgeAnalysisController();
      console.log(`[${new Date().toISOString()}] Daily Update Cron completed successfully`);
      
    } catch (error) {
      console.error('Error running initializeDailyUpdateCron:', error);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
};

export default initializeDailyUpdateCron;
