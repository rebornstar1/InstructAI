import redis from './redis';

// Default expiration time (1 hour)
const DEFAULT_EXPIRATION = 3600;

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached data or null
 */
export const getCachedData = async (key) => {
  try {
    const cachedData = await redis.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error(`Error retrieving cached data for key ${key}:`, error);
    return null;
  }
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} expiration - Expiration time in seconds
 */
export const setCachedData = async (key, data, expiration = DEFAULT_EXPIRATION) => {
  try {
    await redis.setex(key, expiration, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error setting cached data for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete item from cache
 * @param {string} key - Cache key
 */
export const deleteCachedData = async (key) => {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting cached data for key ${key}:`, error);
    return false;
  }
};

/**
 * Clear cache with pattern
 * @param {string} pattern - Key pattern to match (e.g., "ai-responses:*")
 */
export const clearCacheByPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
    return true;
  } catch (error) {
    console.error(`Error clearing cache with pattern ${pattern}:`, error);
    return false;
  }
};