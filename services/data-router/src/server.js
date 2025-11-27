import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger } from '../../../shared/utils/logger.js';
import { getRedisClient, closeRedisClient } from '../../../shared/utils/redis-client.js';

dotenv.config();

const app = express();
const logger = createLogger('data-router');
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Track active subscriptions
const subscriptions = new Map(); // Map<channelId, Set<socketId>>
let redis = null;
let redisSubscriber = null;

// Initialize Redis subscriber
async function initializeRedisSubscriber() {
  try {
    redis = await getRedisClient();
    redisSubscriber = redis.duplicate();
    await redisSubscriber.connect();

    // Subscribe to channel updates from collector
    await redisSubscriber.subscribe('channel:updates', (message) => {
      try {
        const data = JSON.parse(message);
        
        // Broadcast to subscribed clients
        const subs = subscriptions.get(data.channelId);
        if (subs && subs.size > 0) {
          io.to(`channel:${data.channelId}`).emit('channelUpdate', data);
          logger.debug(`Broadcasted update for ${data.channelId} to ${subs.size} client(s)`);
        }
      } catch (error) {
        logger.error('Error processing channel update:', error);
      }
    });

    // Subscribe to alarms
    await redisSubscriber.subscribe('alarms', (message) => {
      try {
        const alarm = JSON.parse(message);
        io.emit('alarm', alarm);
        logger.debug('Broadcasted alarm');
      } catch (error) {
        logger.error('Error processing alarm:', error);
      }
    });

    logger.info('Redis subscriber initialized');
  } catch (error) {
    logger.error('Error initializing Redis subscriber:', error);
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await redis.ping();
    
    res.json({
      status: 'ok',
      service: 'data-router',
      version: '1.2.1',
      connections: io.engine.clientsCount,
      subscriptions: subscriptions.size,
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

// Get current value for a channel
app.get('/channels/:channelId/value', async (req, res) => {
  try {
    const { channelId } = req.params;
    const value = await redis.get(`live:${channelId}`);
    
    if (!value) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Channel not found or no data available'
        }
      });
    }

    res.json(JSON.parse(value));
  } catch (error) {
    logger.error('Error getting channel value:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('subscribe', async ({ channels }) => {
    logger.info(`Socket ${socket.id} subscribing to ${channels.length} channel(s)`);
    
    for (const channelId of channels) {
      if (!subscriptions.has(channelId)) {
        subscriptions.set(channelId, new Set());
      }
      subscriptions.get(channelId).add(socket.id);
      socket.join(`channel:${channelId}`);

      // Send current value immediately
      try {
        const value = await redis.get(`live:${channelId}`);
        if (value) {
          socket.emit('channelUpdate', JSON.parse(value));
        }
      } catch (error) {
        logger.error(`Error sending initial value for ${channelId}:`, error);
      }
    }
  });
  
  socket.on('unsubscribe', ({ channels }) => {
    logger.info(`Socket ${socket.id} unsubscribing from ${channels.length} channel(s)`);
    
    channels.forEach(channelId => {
      const subs = subscriptions.get(channelId);
      if (subs) {
        subs.delete(socket.id);
        if (subs.size === 0) {
          subscriptions.delete(channelId);
        }
      }
      socket.leave(`channel:${channelId}`);
    });
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    
    // Clean up subscriptions
    subscriptions.forEach((subs, channelId) => {
      subs.delete(socket.id);
      if (subs.size === 0) {
        subscriptions.delete(channelId);
      }
    });
  });
});

// Start server
server.listen(PORT, async () => {
  logger.info(`Data Router listening on port ${PORT}`);
  logger.info(`WebSocket server ready`);
  await initializeRedisSubscriber();
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  
  if (redisSubscriber) {
    await redisSubscriber.quit();
  }
  
  io.close(() => {
    server.close(async () => {
      await closeRedisClient();
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
