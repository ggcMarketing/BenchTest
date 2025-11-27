import express from 'express';
import dotenv from 'dotenv';
import { createLogger } from '../../../shared/utils/logger.js';
import { getDbPool, closeDbPool } from '../../../shared/utils/db-client.js';
import { getRedisClient, closeRedisClient } from '../../../shared/utils/redis-client.js';

dotenv.config();

const app = express();
const logger = createLogger('collector');
const PORT = process.env.PORT || 3002;

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
      service: 'collector',
      version: '1.2.1',
      protocols: {
        modbus: 'ready',
        'ethernet-ip': 'ready',
        opcua: 'ready',
        mqtt: 'ready',
        egd: 'ready'
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
  logger.info(`Collector service listening on port ${PORT}`);
  logger.info('Protocol engines initialized');
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
