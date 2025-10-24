import mongoose from 'mongoose';
import { findInCache, scanCacheKeys, deleteInCache } from '../cache_service/index.js';

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

  // Get all keys matching the pattern using global cache function
  const keys = await scanCacheKeys(redisKeyPattern + '*');
  
  for (const key of keys) {
    scanned += 1;
    
    try {
      // Extract ID from the key (assume it's the last part after underscore or colon)
      const keyParts = key.split(/[_:]/); 
      const id = keyParts[keyParts.length - 1];
      
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
            updateData[dbField] = parsedValue; // Already parsed JSON object
            break;
          default:
            updateData[dbField] = parsedValue; // Use as-is
        }
      }
      

      const result = await Model.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount > 0) {
        updated += 1;
        // Delete from Redis after successful MongoDB update
        try {
          await deleteInCache(key);
        } catch (deleteErr) {
          console.error(`Failed to delete Redis key ${key}:`, deleteErr.message);
        }
      } else {
        skipped += 1;
      }

    } catch (err) {
      errors.push({ key, message: err.message });
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
