import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger } from '../../../shared/utils/logger.js';
import { getDbPool, closeDbPool } from '../../../shared/utils/db-client.js';
import { getRedisClient, closeRedisClient } from '../../../shared/utils/redis-client.js';
import { StorageManager } from './storage-manager.js';

dotenv.config();

const app = express();
const logger = createLogger('storage-engine');
const PORT = process.env.PORT || 3003;

// Initialize storage manager
const storageManager = new StorageManager();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const db = getDbPool();
    await db.query('SELECT 1');
    
    const redis = await getRedisClient();
    await redis.ping();
    
    const stats = storageManager.getStats();
    
    res.json({
      status: 'ok',
      service: 'storage-engine',
      version: '1.2.1',
      backends: {
        timescaledb: 'connected',
        file: 'ready'
      },
      ...stats,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get storage statistics
app.get('/stats', (req, res) => {
  const stats = storageManager.getStats();
  res.json(stats);
});

// Reload storage rules
app.post('/reload', async (req, res) => {
  try {
    await storageManager.reloadRules();
    res.json({ message: 'Storage rules reloaded successfully' });
  } catch (error) {
    logger.error('Error reloading rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Query historical data
app.post('/query', async (req, res) => {
  try {
    const { channelId, startTime, endTime, options } = req.body;

    if (!channelId || !startTime || !endTime) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'channelId, startTime, and endTime are required'
        }
      });
    }

    const data = await storageManager.queryHistorical(
      channelId,
      startTime,
      endTime,
      options || {}
    );

    res.json({ data });
  } catch (error) {
    logger.error('Query error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// Initialize database connection
async function initializeDatabase() {
  try {
    const db = getDbPool();
    await db.query('SELECT 1');
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

// Initialize Redis connection
async function initializeRedis() {
  try {
    const redis = await getRedisClient();
    await redis.ping();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
}

// Initialize services
async function initialize() {
  try {
    await initializeDatabase();
    await initializeRedis();
    await storageManager.initialize();
    logger.info('Storage engine initialized');
  } catch (error) {
    logger.error('Initialization error:', error);
    process.exit(1);
  }
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Storage Engine listening on port ${PORT}`);
  await initialize();
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  
  server.close(async () => {
    await storageManager.shutdown();
    await closeDbPool();
    await closeRedisClient();
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
