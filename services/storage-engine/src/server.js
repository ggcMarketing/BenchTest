import express from 'express';
import dotenv from 'dotenv';
import { createLogger } from '../../../shared/utils/logger.js';
import { getDbPool, closeDbPool } from '../../../shared/utils/db-client.js';
import { getRedisClient, closeRedisClient } from '../../../shared/utils/redis-client.js';

dotenv.config();

const app = express();
const logger = createLogger('storage-engine');
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const db = getDbPool();
    await db.query('SELECT 1');
    
    const redis = await getRedisClient();
    await redis.ping();
    
    res.json({
      status: 'ok',
      service: 'storage-engine',
      version: '1.2.1',
      backends: {
        timescaledb: 'connected',
        file: 'ready'
      },
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

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Storage Engine listening on port ${PORT}`);
  logger.info('Storage backends initialized');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await closeDbPool();
    await closeRedisClient();
    logger.info('Server closed');
    process.exit(0);
  });
});
