import mongoose from 'mongoose';
import { findInCache, scanCacheKeys, deleteInCache } from '../cache_service/index.js';
<<<<<<< Updated upstream
import { radis_pattern } from '../configs/constant.js';
=======
import { redis_keys } from '../configs/constant.js';
>>>>>>> Stashed changes

async function moveDataRedisToMongodb(redisKeyPattern, modelName, fieldMapping = {}) {
  // Get the model from mongoose models
  const Model = mongoose.models[modelName];
  if (!Model) {
    throw new Error(`Model '${modelName}' not found`);
  }

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  // Get all keys matching the pattern - scanCacheKeys already limits to 10,000 keys
  const keys = await scanCacheKeys(redisKeyPattern + '*');
  
<<<<<<< Updated upstream
  console.log(`Found ${keys.length} keys to process in this run`);
  
=======
>>>>>>> Stashed changes
  // Process in batches for better MongoDB performance
  const batchSize = 50;
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    const bulkOps = [];
    const keysToDelete = [];
    
    for (const key of batch) {
      scanned += 1;
      
      try {
        // Extract ID from the key
        const keyParts = key.split(/[_:]/); 
<<<<<<< Updated upstream
        const id = keyParts[keyParts.length - 1];
=======
        const id = keyParts[keyParts.length - 2];
        const version_id=keyParts[keyParts.length - 1];
>>>>>>> Stashed changes
        
        if (!id || !mongoose.isValidObjectId(id)) {
          skipped += 1;
          continue;
        }

        const redisValue = await findInCache(key);
        if (!redisValue) {
          skipped += 1;
          continue;
        }

        const parsedValue = JSON.parse(redisValue);
        const updateData = {};
        
        for (const [dbField, config] of Object.entries(fieldMapping)) {
          switch (config.type) {
            case 'date':
              updateData[dbField] = new Date(parsedValue);
              break;
            case 'number':
              updateData[dbField] = Number(parsedValue);
              break;
            case 'string':
              updateData[dbField] = String(parsedValue);
              break;
            case 'boolean':
              updateData[dbField] = Boolean(parsedValue);
              break;
            case 'object':
              updateData[dbField] = parsedValue;
              break;
            default:
              updateData[dbField] = parsedValue;
          }
        }
        
        // Add to bulk operations
        bulkOps.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(id) },
            update: { $set: updateData }
          }
        });
        
        keysToDelete.push(key);
        
        // Collect additional bridge-related keys for batch deletion
        if(redisKeyPattern === 'bridgeusedcost_'){
<<<<<<< Updated upstream
          const cache_key = `${radis_pattern.bridge_data_with_tools_}${id}`;
          const cache_key2 = `${radis_pattern.get_bridge_data_}${id}`;
          keysToDelete.push(cache_key, cache_key2);
=======
          const cache_key = `${redis_keys.bridge_data_with_tools_}${version_id}`;
          const cache_key1 = `${redis_keys.bridge_data_with_tools_}${id}`;
          const cache_key2 = `${redis_keys.get_bridge_data_}${version_id}`;
          const cache_key3 = `${redis_keys.get_bridge_data_}${id}`;
          keysToDelete.push(cache_key,cache_key1,cache_key2,cache_key3);
>>>>>>> Stashed changes
        }

      } catch (err) {
        errors.push({ key, message: err.message });
      }
    }
    
    // Execute bulk operations
    if (bulkOps.length > 0) {
      try {
        const bulkResult = await Model.bulkWrite(bulkOps, { ordered: false });
        updated += bulkResult.modifiedCount;
        
        // Delete successfully processed keys from Redis
        if (keysToDelete.length > 0) {
          await deleteInCache(keysToDelete);
        }
        
      } catch (bulkErr) {
        console.error('Bulk operation error:', bulkErr.message);
        errors.push({ batch: i, message: bulkErr.message });
      }
    }
    
    // Add delay between batches
    if (i + batchSize < keys.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const result = {
    success: errors.length === 0,
    scanned,
    updated,
    skipped,
    errors
  };

  return result;
}


export default moveDataRedisToMongodb;
