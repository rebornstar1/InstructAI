/**
 * Get data from cache via API
 * @param {string} key - Cache key
 * @returns {Promise<{data: any, cached: boolean}>} - Cached data or null
 */
export const getCachedData = async (key) => {
  try {
    const response = await fetch(`/api/cache?key=${encodeURIComponent(key)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cache API error:', errorData);
      return { data: null, cached: false };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error retrieving cached data for key ${key}:`, error);
    return { data: null, cached: false };
  }
};

/**
 * Set data in cache via API
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} expiration - Expiration time in seconds
 */
export const setCachedData = async (key, data, expiration = 3600) => {
  try {
    const response = await fetch('/api/cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, data, expiration }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cache API error:', errorData);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting cached data for key ${key}:`, error);
    return false;
  }
};