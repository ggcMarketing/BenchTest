const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const MockDataGenerator = require('./mockDataGenerator');
const {
  initializeDatabase,
  storeTagData,
  getHistoricalData,
  storeCoil,
  getCoils,
  authenticateUser,
  storeAlarm,
  getActiveAlarms
} = require('./database');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize database
initializeDatabase();

// Initialize mock data generator
const dataGen = new MockDataGenerator();

// Track active subscriptions: Map<tagPath, Set<socketId>>
const activeSubscriptions = new Map();

// Track tag update intervals: Map<tagPath, intervalId>
const tagIntervals = new Map();

// REST API endpoints
app.get('/api', (req, res) => {
  res.json({
    name: 'ParX Industrial Analytics API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      tags: '/api/tags',
      tagsList: '/api/tags/list',
      coils: '/api/coils',
      coilById: '/api/coils/:coilId',
      profile: '/api/profile/:coilId',
      historical: '/api/historical/:tagPath',
      login: '/api/auth/login',
      alarms: '/api/alarms',
      currentCoil: '/api/coil/current'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/tags', (req, res) => {
  res.json(dataGen.getTagTree());
});

app.get('/api/tags/list', (req, res) => {
  const tags = Object.keys(dataGen.tags).map(path => ({
    path,
    ...dataGen.tags[path]
  }));
  res.json({ tags });
});

app.get('/api/coils', async (req, res) => {
  try {
    const coils = await getCoils();
    res.json({ coils });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coils/:coilId', async (req, res) => {
  try {
    const coils = await getCoils();
    const coil = coils.find(c => c.id === req.params.coilId);

    if (!coil) {
      return res.status(404).json({ error: 'Coil not found' });
    }

    res.json(coil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profile/:coilId', (req, res) => {
  const profile = dataGen.generateCrossWidthProfile();
  res.json({
    coilId: req.params.coilId,
    profile,
    timestamp: Date.now()
  });
});

app.get('/api/historical/:tagPath', async (req, res) => {
  try {
    const tagPath = decodeURIComponent(req.params.tagPath);
    const startTime = parseInt(req.query.start) || Date.now() - 3600000;
    const endTime = parseInt(req.query.end) || Date.now();
    const limit = parseInt(req.query.limit) || 1000;

    const data = await getHistoricalData(tagPath, startTime, endTime, limit);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      token: `mock-token-${user.id}-${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alarms', async (req, res) => {
  try {
    const alarms = await getActiveAlarms();
    res.json({ alarms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coil/current', (req, res) => {
  const coilStatus = dataGen.updateCoilProgress();
  res.json(coilStatus);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', ({ tagId }) => {
    console.log(`Socket ${socket.id} subscribing to ${tagId}`);

    if (!activeSubscriptions.has(tagId)) {
      activeSubscriptions.set(tagId, new Set());
      startTagStream(tagId);
    }

    activeSubscriptions.get(tagId).add(socket.id);
  });

  socket.on('unsubscribe', ({ tagId }) => {
    console.log(`Socket ${socket.id} unsubscribing from ${tagId}`);

    const subs = activeSubscriptions.get(tagId);
    if (subs) {
      subs.delete(socket.id);
      if (subs.size === 0) {
        activeSubscriptions.delete(tagId);
        stopTagStream(tagId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Clean up all subscriptions for this socket
    activeSubscriptions.forEach((subs, tagId) => {
      subs.delete(socket.id);
      if (subs.size === 0) {
        activeSubscriptions.delete(tagId);
        stopTagStream(tagId);
      }
    });
  });
});

function startTagStream(tagPath) {
  console.log(`Starting stream for ${tagPath}`);

  const interval = setInterval(() => {
    const value = dataGen.generateValue(tagPath);
    const subscribers = activeSubscriptions.get(tagPath);

    if (subscribers && subscribers.size > 0 && value !== null) {
      const timestamp = Date.now();
      const data = {
        tagId: tagPath,
        tagPath,
        value,
        quality: 'GOOD',
        timestamp
      };

      // Store in database (sample every 10th point to reduce storage)
      if (Math.random() > 0.9) {
        storeTagData(tagPath, value, 'GOOD', timestamp);
      }

      // Send to all subscribers
      subscribers.forEach(socketId => {
        io.to(socketId).emit('tagUpdate', data);
      });

      // Check for alarm conditions
      checkAlarms(tagPath, value, timestamp);
    }
  }, 1000); // 1 Hz update rate

  tagIntervals.set(tagPath, interval);
}

function stopTagStream(tagPath) {
  console.log(`Stopping stream for ${tagPath}`);

  const interval = tagIntervals.get(tagPath);
  if (interval) {
    clearInterval(interval);
    tagIntervals.delete(tagPath);
  }
}

function checkAlarms(tagPath, value, timestamp) {
  const config = dataGen.tags[tagPath];
  if (!config || config.type === 'digital') return;

  // Simple threshold-based alarms
  const highThreshold = config.base + config.range * 1.5;
  const lowThreshold = config.base - config.range * 1.5;

  if (value > highThreshold) {
    storeAlarm(tagPath, 'WARNING', `${tagPath} is high: ${value.toFixed(2)} ${config.unit}`, timestamp);
    io.emit('alarm', {
      tagPath,
      severity: 'WARNING',
      message: `${tagPath} is high: ${value.toFixed(2)} ${config.unit}`,
      timestamp
    });
  } else if (value < lowThreshold) {
    storeAlarm(tagPath, 'WARNING', `${tagPath} is low: ${value.toFixed(2)} ${config.unit}`, timestamp);
    io.emit('alarm', {
      tagPath,
      severity: 'WARNING',
      message: `${tagPath} is low: ${value.toFixed(2)} ${config.unit}`,
      timestamp
    });
  }
}

// Periodic tasks
setInterval(() => {
  const coilHistory = dataGen.getCoilHistory();
  coilHistory.forEach(coil => {
    storeCoil(coil);
  });
}, 60000); // Update coil data every minute

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`ParX Backend running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
