import client from '../services/cacheService.js'; // your Redis client
import mongoose from 'mongoose';
import cron from 'node-cron';
import config from "../../config/config.js";
import configurationModel from '../mongoModel/configuration.js'
import ApikeyCredential from '../mongoModel/apiModel.js'
const Bridge = configurationModel;
const ApiKey = ApikeyCredential;

/**
 * Fetch Redis quota data for the two prefixes
 */

async function findInCacheByPrefixArray(prefix){
  const REDIS_PREFIX = 'AIMIDDLEWARE_';
  if (!client.isReady) return false;
  
  try {
    if (typeof prefix !== 'string') {
      throw new Error('Prefix must be a string');
    }
    
    const keys = await client.keys(REDIS_PREFIX + prefix + '*');
    
    if (!keys || keys.length === 0) return null;
    
    const result = {};
    
    // Get values one by one
    for (const key of keys) {
      if (key && typeof key === 'string') {
        try {
          const value = await client.get(key);
          const cleanKey = key.replace(REDIS_PREFIX, '');
          result[cleanKey] = value;
        } catch (err) {
          console.error(`Error getting value for key ${key}:`, err);
        }
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Error searching cache by prefix:', error);
    return false;
  }
}

const getQuotaData = async () => {
  const REDIS_PREFIX = 'AIMIDDLEWARE_';
  const prefixes = ['bridge_quota', 'apikey_quota'];
  const result = {};

  try {
    for (const prefix of prefixes) {
      const prefixData = {};
      
      const reply = await findInCacheByPrefixArray(prefix);
      
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
      { $set: { bridge_quota: quotaData.bridge_quota[key] } },
      { upsert: true } // create if doesn't exist
    );
  }

  // Update apikey_quota
  for (const key in quotaData.apikey_quota) {
    const id = key.replace('apikey_quota_', ''); // extract ID
    if (!mongoose.Types.ObjectId.isValid(id)) continue;
    await ApiKey.updateOne(
      { _id: id },
      { $set: { apikey_quota: quotaData.apikey_quota[key] } },
      { upsert: true } // create if doesn't exist
    );
  }

  console.log('MongoDB updated successfully.');
};


const startDailyQuotaCron = async () => {
    // Schedule the cron job to run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily Redis -> MongoDB quota update...');

        try {
            // Connect to MongoDB if not already connected
            if (mongoose.connection.readyState !== 1) {
                await mongoose.connect(config.mongo.uri, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                });
                console.log('MongoDB connected');
            }

            // Update the quotas
            await updateQuotaInDB();
        } catch (error) {
            console.error('Error in daily quota update cron:', error);
        }
    });
} 


// Start the cron job
export default startDailyQuotaCron