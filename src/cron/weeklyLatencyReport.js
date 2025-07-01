import cron from 'node-cron';
import { getWeeklyreports } from '../controllers/reportController.js';

const initializeWeeklyLatencyReport = () => {
  cron.schedule('0 0 * * 1', async () => {
    try {
      console.log('Running weekly latency report...');
      await getWeeklyreports();
    } catch (error) {
      console.error('Error generating weekly latency report:', error);
    }
  });
};

export default initializeWeeklyLatencyReport;
