// import { client, isReady } from '../config/redis.js';
import client from '../services/cacheService.js';
// import scriptDbService from '../db_services/db/script_db_service.js';
const REDIS_PREFIX = 'AIMIDDLEWARE_';
const DEFAULT_REDIS_TTL = 172800; //  on day
async function storeInCache(identifier, data) {

  if (client.isReady) return await client.set(REDIS_PREFIX + identifier, JSON.stringify(data), 'EX', DEFAULT_REDIS_TTL);
  return false;
}

async function findInCache(identifier) {
  if (client.isReady) return await client.get(REDIS_PREFIX + identifier);
  return false;
}

async function deleteInCache(identifiers) {
  if (!client.isReady) {
    return false;
  }
  if (!Array.isArray(identifiers)) {
    identifiers = [identifiers];
  }
  const keysToDelete = identifiers.map((id) => REDIS_PREFIX + id);

  try {
    const deleteCount = await client.del(keysToDelete);
    console.log(`Deleted ${deleteCount} items from cache`);
    return true;
  } catch (error) {
    console.error('Error during deletion:', error);
    return false;
  }
}

export {
    deleteInCache,
  storeInCache,
  findInCache,
};
