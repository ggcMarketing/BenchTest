import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger } from '../../../shared/utils/logger.js';
import { getDbPool, closeDbPool } from '../../../shared/utils/db-client.js';
import { getRedisClient, closeRedisClient } from '../../../shared/utils/redis-client.js';

dotenv.config();

const app = express();
const logger = createLogger('admin-api');
const PORT = process.env.PORT || 3000;

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
    
    res.json({
      status: 'ok',
      service: 'admin-api',
      version: '1.2.1',
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

// API routes placeholder
app.get('/api/v1', (req, res) => {
  res.json({
    service: 'ParX Admin API',
    version: '1.2.1',
    endpoints: {
      auth: '/api/v1/auth',
      channels: '/api/v1/io/channels',
      storageRules: '/api/v1/storage/rules',
      dashboards: '/api/v1/dashboards',
      users: '/api/v1/users'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Admin API listening on port ${PORT}`);
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
