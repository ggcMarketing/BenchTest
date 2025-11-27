import express from 'express';
import dotenv from 'dotenv';
import { createLogger } from '../../../shared/utils/logger.js';
import { getDbPool, closeDbPool } from '../../../shared/utils/db-client.js';
import { getRedisClient, closeRedisClient } from '../../../shared/utils/redis-client.js';
import { CollectorManager } from './collector-manager.js';
import { BufferManager } from './buffer-manager.js';

dotenv.config();

const app = express();
const logger = createLogger('collector');
const PORT = process.env.PORT || 3002;

// Initialize managers
const collectorManager = new CollectorManager();
const bufferManager = new BufferManager();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const db = getDbPool();
    await db.query('SELECT 1');
    
    const redis = await getRedisClient();
    await redis.ping();
    
    const status = collectorManager.getStatus();
    
    res.json({
      status: 'ok',
      service: 'collector',
      version: '1.2.1',
      ...status,
      bufferSize: bufferManager.size(),
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

// Get collector status
app.get('/status', (req, res) => {
  const status = collectorManager.getStatus();
  res.json({
    ...status,
    bufferSize: bufferManager.size()
  });
});

// Reload channels
app.post('/reload', async (req, res) => {
  try {
    await collectorManager.reloadChannels();
    res.json({ message: 'Channels reloaded successfully' });
  } catch (error) {
    logger.error('Error reloading channels:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize services
async function initialize() {
  try {
    await bufferManager.initialize();
    await collectorManager.initialize();
    logger.info('Collector services initialized');
  } catch (error) {
    logger.error('Initialization error:', error);
    process.exit(1);
  }
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Collector service listening on port ${PORT}`);
  await initialize();
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  
  server.close(async () => {
    await collectorManager.shutdown();
    await bufferManager.shutdown();
    await closeDbPool();
    await closeRedisClient();
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
