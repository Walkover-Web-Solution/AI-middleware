import mongoose from 'mongoose';
import cron from 'node-cron';
import configurationModel from '../mongoModel/configuration.js'
import ApikeyCredential from '../mongoModel/apiModel.js'
import { findInCache } from '../cache_service/index.js';
import quotaPrefix from '../configs/constants.js';
const Bridge = configurationModel;
const ApiKey = ApikeyCredential;

const getQuotaData = async () => {
  const prefixes = [quotaPrefix.bridge_quota, quotaPrefix.apikey_quota];
  const result = {};

  try {
    for (const prefix of prefixes) {
      const prefixData = {};
      
      const reply = await findInCache(prefix);
      
      if (reply && typeof reply === 'object') {
        Object.entries(reply).forEach(([key, value]) => {
          try {
            if (value !== null && value !== undefined) {
              const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
              prefixData[key] = parsedValue;
            }
          } catch (err) {
            console.error(`Error parsing value for key ${key}:`, err);
            // Keep raw value if parsing fails
            prefixData[key] = value;
          }
        });
      }
      
      result[prefix] = prefixData;
    }
  } catch (err) {
    console.error('Error fetching quota data:', err);
  }

  return result;
};
/**
 * Update MongoDB collections based on Redis quota data
 */
const updateQuotaInDB = async () => {
  const quotaData = await getQuotaData();

  // Update bridge_quota
  for (const key in quotaData.bridge_quota) {
    const id = key.replace('bridge_quota_', ''); // extract ID
    if (!mongoose.Types.ObjectId.isValid(id)) continue;
    await Bridge.updateOne(
      { _id: id },
      { $set: { bridge_quota: quotaData.bridge_quota[key] } }
    );
  }

  // Update apikey_quota
  for (const key in quotaData.apikey_quota) {
    const id = key.replace('apikey_quota_', ''); // extract ID
    if (!mongoose.Types.ObjectId.isValid(id)) continue;
    await ApiKey.updateOne(
      { _id: id },
      { $set: { apikey_quota: quotaData.apikey_quota[key] } }
    );
  }

  console.log('MongoDB updated successfully.');
};


const startDailyQuotaCron = async () => {
    // Schedule the cron job to run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
    //cron.schedule('*/5 * * * * *', async () => {       //for testing every 5 secs.
      console.log('Running daily Redis -> MongoDB quota update...');

      try {
        // Update the quotas
        await updateQuotaInDB();
      } catch (error) {
        console.error('Error in daily quota update cron:', error);
      }
  });
} 


// Start the cron job
export default startDailyQuotaCron