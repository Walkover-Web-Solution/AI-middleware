import { findInCache, storeInCache, verifyTTL } from '../cache_service/index.js';

// Function to extract nested value from the request object
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
};

// Custom rate limiter middleware
const rateLimiterMiddleware = (keyPath, options={}) => {
  const { points=5} = options;

  return async (req, res, next) => {
    try {
      const key = getNestedValue(req, keyPath);
      if (!key) return res.status(400).json({ error: 'Invalid key path or key not found in request' });
      const redisKey = `rate-limit:${key}`;
        const record = await findInCache(redisKey);
        let data;
        let ttl = 10 ;
        if (record) {
          ttl = await verifyTTL(redisKey); 
          data = JSON.parse(record);
          const { count } = data;
            if (count >= points) {
              res.set('Retry-After', String(ttl));
              return res.status(429).json({ error: 'Too many requests' });
            }
            data.count += 1;
        } else {
          data = { count: 1};
        }

        await storeInCache(redisKey, data, ttl);
        next();
    } catch (error) {
      next(error);
    }
  };
};

export default rateLimiterMiddleware;
