
import client from '../services/cacheService.js';
const REDIS_PREFIX = 'AIMIDDLEWARE_';
const DEFAULT_REDIS_TTL = 172800; //  2 day
async function storeInCache(identifier, data, ttl = DEFAULT_REDIS_TTL) {

  if (client.isReady) return await client.set(REDIS_PREFIX + identifier, JSON.stringify(data), { EX: ttl });
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

async function verifyTTL(identifier) {
  try {
    if (client.isReady) {
      const ttl = await client.ttl(REDIS_PREFIX + identifier);
      console.log(`TTL for key ${REDIS_PREFIX + identifier} is ${ttl} seconds`);
      return ttl;
    } else {
      console.error('Redis client is not ready');
      return -2; // Indicating error
    }
  } catch (error) {
    console.error('Error retrieving TTL from cache:', error);
    return;
  }
}


export {
    deleteInCache,
  storeInCache,
  findInCache,
  verifyTTL
};
