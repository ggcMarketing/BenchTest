import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger } from '../../../shared/utils/logger.js';
import { getDbPool, closeDbPool } from '../../../shared/utils/db-client.js';
import { getRedisClient, closeRedisClient } from '../../../shared/utils/redis-client.js';

// Import routes
import authRoutes from './routes/auth.js';
import channelsRoutes from './routes/channels.js';
import storageRulesRoutes from './routes/storage-rules.js';
import dashboardsRoutes from './routes/dashboards.js';

dotenv.config();

const app = express();
const logger = createLogger('admin-api');
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

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

// API info endpoint
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

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/io/channels', channelsRoutes);
app.use('/api/v1/storage/rules', storageRulesRoutes);
app.use('/api/v1/dashboards', dashboardsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
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
  logger.info('Routes mounted: auth, channels, storage-rules, dashboards');
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
