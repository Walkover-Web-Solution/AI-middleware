import { findInCache, storeInCache } from '../cache_service/index.js';

// Function to extract nested value from the request object
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
};

// Custom rate limiter middleware
const rateLimiterMiddleware = (keyPath, options={}) => {
  const { points=50, duration=60 } = options;

  return async (req, res, next) => {
    try {
      const key = getNestedValue(req, keyPath);
      if (!key) {
        return res.status(400).json({ error: 'Invalid key path or key not found in request' });
      }

      const redisKey = `rate-limit:${key}`;
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        const record = await findInCache(redisKey);
        let data;

        if (record) {
          data = JSON.parse(record);
          const { count, expiry } = data;

          if (currentTime < expiry) {
            if (count >= points) {
              res.set('Retry-After', String(expiry - currentTime));
              return res.status(429).json({ error: 'Too many requests' });
            }
            data.count += 1;
          } else {
            // Reset the rate limit counter if the duration has passed
            data = { count: 1, expiry: currentTime + duration };
          }
        } else {
          data = { count: 1, expiry: currentTime + duration };
        }

        await storeInCache(redisKey, data);
        next();
    } catch (error) {
      next(error);
    }
  };
};

export default rateLimiterMiddleware;
