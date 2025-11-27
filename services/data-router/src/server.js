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
  }
});

// Track active subscriptions
const subscriptions = new Map();

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const redis = await getRedisClient();
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

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('subscribe', ({ channels }) => {
    logger.info(`Socket ${socket.id} subscribing to ${channels.length} channels`);
    
    channels.forEach(channelId => {
      if (!subscriptions.has(channelId)) {
        subscriptions.set(channelId, new Set());
      }
      subscriptions.get(channelId).add(socket.id);
      socket.join(`channel:${channelId}`);
    });
  });
  
  socket.on('unsubscribe', ({ channels }) => {
    logger.info(`Socket ${socket.id} unsubscribing from ${channels.length} channels`);
    
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
server.listen(PORT, () => {
  logger.info(`Data Router listening on port ${PORT}`);
  logger.info(`WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  io.close(() => {
    server.close(async () => {
      await closeRedisClient();
      logger.info('Server closed');
      process.exit(0);
    });
  });
});
