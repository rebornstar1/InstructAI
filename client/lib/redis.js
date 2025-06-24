import { Redis } from 'ioredis';

// Make sure this code runs only on the server
if (typeof window !== 'undefined') {
  throw new Error('This module should only be used on the server side');
}

// Configure Redis client
const getRedisConfiguration = () => {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    // Optional configurations
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
  };
};

// Create Redis client instance
const redis = new Redis(getRedisConfiguration());

// Add event listeners for connection status
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Connected to Redis successfully');
});

export default redis;