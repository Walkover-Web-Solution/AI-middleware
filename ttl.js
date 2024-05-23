// cronJobs/cleanupOldData.js
import combinedModels from './models';
const cron = require('node-cron');
const { Op } = require('sequelize');
const postgres =combinedModels.pg

cron.schedule('0 0 * * *', async () => {
  try {
    await postgres.pg.raw_data.destroy({
      where: {
        created_at: {
          [Op.lt]: new Date(new Date() - 10 * 24 * 60 * 60 * 1000)
        }
      }
    });
    console.log('Old records deleted successfully');
  } catch (error) {
    console.error('Error deleting old records:', error);
  }
});

