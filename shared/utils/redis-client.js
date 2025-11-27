import { createClient } from 'redis';
import { createLogger } from './logger.js';

const logger = createLogger('redis-client');

let client = null;

/**
 * Get or create Redis client
 * @returns {Promise<RedisClient>}
 */
export async function getRedisClient() {
  if (client && client.isOpen) {
    return client;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis reconnection failed after 10 attempts');
          return new Error('Redis reconnection limit exceeded');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  client.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('reconnecting', () => {
    logger.warn('Redis client reconnecting');
  });

  await client.connect();
  
  return client;
}

/**
 * Close Redis connection
 */
export async function closeRedisClient() {
  if (client && client.isOpen) {
    await client.quit();
    logger.info('Redis client disconnected');
  }
}
