import cron from 'node-cron';
import { findInCache, storeInCache } from '../cache_service/index.js';
import quotaPrefix from '../configs/constants.js';
import configurationModel from '../mongoModel/configuration.js';
import ApikeyCredential from '../mongoModel/apiModel.js';

const Bridge = configurationModel;
const ApiKey = ApikeyCredential;

/**
 * Resets the 'used' count to 0 in both MongoDB and Redis for all
 * bridges and apikeys that have a quota object.
 */
const resetMonthlyQuotas = async () => {
  try {

    //--- Step 1: Reset bridge quotas in DB ---//
    const bridgeUpdateResult = await Bridge.updateMany(
      { bridge_quota: { $exists: true } }, // Find only docs with a bridge_quota field
      { $set: { 'bridge_quota.used': 0 } } // Reset the nested 'used' field to 0
    );
 
    const apikeyUpdateResult = await ApiKey.updateMany(
      { apikey_quota: { $exists: true } }, // Find only docs with an apikey_quota field
      { $set: { 'apikey_quota.used': 0 } } // Reset the nested 'used' field to 0
    );
    console.log('Finished resetting quotas in MongoDB.');

    // --- Step 2: Reset quotas in Redis --- //
    const prefixes = [quotaPrefix.bridge_quota, quotaPrefix.apikey_quota];
    for (const prefix of prefixes) {
      const allQuotas = await findInCache(prefix);
      if (allQuotas) {
        for (const key in allQuotas) {
          try {
            const quotaObject = JSON.parse(allQuotas[key]);
            if (quotaObject && typeof quotaObject.used !== 'undefined') {
              quotaObject.used = 0;
              await storeInCache(key, quotaObject);
            }
          } catch (parseError) {
            // This key might not have a valid quota object, safe to ignore.
          }
        }
      }
    }
    console.log('Finished resetting quotas in Redis.');

  } catch (error) {
    console.error('Error during the monthly quota reset process:', error);
  }
  
  console.log('Monthly quota reset process finished.');
};

/**
 * Schedules the monthly quota reset cron job.
 */
const startMonthlyQuotaResetCron = () => {
  // Schedule to run at 00:00 on the 1st day of every month.
  cron.schedule('0 0 1 * *', async () => {
    await resetMonthlyQuotas();
  });
  console.log('Monthly quota reset job scheduled.');
};

export default startMonthlyQuotaResetCron;
