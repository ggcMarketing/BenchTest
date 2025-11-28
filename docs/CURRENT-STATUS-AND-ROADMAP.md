# ParX Current Status & Roadmap to Functional Data Collection

**Date**: November 28, 2025  
**Version**: 1.2.1  
**Status**: Architecture Complete, Integration Pending

---

## Executive Summary

ParX v1.2.1 has a **complete architecture** with all microservices scaffolded, comprehensive UI components built, and extensive documentation. However, the system is **not yet functionally integrated** for end-to-end data collection and trending.

**Current State**: 🟡 **70% Complete**
- ✅ Architecture & Infrastructure (100%)
- ✅ UI Components & Dashboards (100%)
- ✅ Database Schema & APIs (100%)
- 🟡 Data Collection Integration (30%)
- 🟡 Real-time Data Flow (40%)
- ❌ End-to-End Testing (0%)

**Gap**: The services exist but are not fully wired together for actual data collection, storage, and trending.

---

## Current Status Analysis

### ✅ What's Working

#### 1. **Frontend (100% Complete)**
- ✅ Dashboard Builder with drag-and-drop widgets
- ✅ TrendGraph, ValueCard, ProgressBar, AlarmLog widgets
- ✅ Tag assignment capability (just added)
- ✅ Analytics workspace with historical viewer
- ✅ Admin interface with channel tree view
- ✅ WebSocket client integration
- ✅ Authentication & routing

**Status**: Production-ready UI waiting for backend data

#### 2. **Admin API (100% Complete)**
- ✅ JWT authentication
- ✅ User management (CRUD)
- ✅ Interface/Connection/Channel CRUD
- ✅ Storage rules CRUD
- ✅ Dashboard CRUD
- ✅ Database schema with migrations

**Status**: Fully functional configuration API

#### 3. **Architecture (100% Complete)**
- ✅ Microservices structure
- ✅ Docker Compose setup
- ✅ Kubernetes manifests
- ✅ Shared utilities (logger, db-client, redis-client)
- ✅ Database schema (PostgreSQL + TimescaleDB)

**Status**: Infrastructure ready for deployment

#### 4. **Documentation (100% Complete)**
- ✅ Comprehensive architecture docs
- ✅ API specifications
- ✅ Database schema docs
- ✅ Deployment guides
- ✅ Testing guides

**Status**: Well-documented system

### 🟡 What's Partially Working

#### 1. **Collector Service (30% Complete)**
- ✅ Service structure exists
- ✅ Protocol engine stubs (Modbus, OPC UA, MQTT, EtherNet/IP, EGD)
- ✅ Buffer manager for disk-backed buffering
- ✅ Collector manager for lifecycle
- ❌ **No actual protocol implementations**
- ❌ **No channel polling logic**
- ❌ **No data publishing to Redis**

**Gap**: Protocol engines are placeholders, not functional

#### 2. **Data Router (40% Complete)**
- ✅ WebSocket server structure
- ✅ Redis pub/sub client
- ✅ Connection management
- ❌ **No actual data routing logic**
- ❌ **No channel subscription management**
- ❌ **No data transformation/formatting**

**Gap**: WebSocket server exists but doesn't route real data

#### 3. **Storage Engine (30% Complete)**
- ✅ Service structure exists
- ✅ TimescaleDB adapter stub
- ✅ Storage rule evaluation logic
- ❌ **No actual data writing**
- ❌ **No batch processing**
- ❌ **No retention policy enforcement**

**Gap**: Storage logic exists but not connected to data flow

#### 4. **Analytics Engine (40% Complete)**
- ✅ FastAPI service structure
- ✅ Historical query endpoints
- ✅ Derived signal endpoints
- ❌ **No actual data retrieval from TimescaleDB**
- ❌ **No formula evaluation**
- ❌ **No aggregation logic**

**Gap**: API endpoints exist but return mock data

### ❌ What's Missing

1. **End-to-End Data Flow**: No actual data flowing from collector → router → storage → UI
2. **Protocol Implementations**: Modbus, OPC UA, MQTT engines are stubs
3. **Real-time Data Streaming**: WebSocket server not publishing real data
4. **Historical Data Storage**: TimescaleDB not receiving data
5. **Historical Queries**: Analytics engine not reading from database
6. **Integration Testing**: No tests verifying complete data flow

---

## Critical Path to Functional System

### Phase 1: Core Data Collection (Week 1-2)
**Goal**: Get data flowing from one protocol to the database

#### Step 1.1: Implement Modbus TCP Collector (Priority 1)
**Files to modify**:
- `services/collector/src/protocols/modbus.js`
- `services/collector/src/collector-manager.js`

**Tasks**:
1. Install `modbus-serial` npm package
2. Implement Modbus TCP connection
3. Implement register reading (holding registers, input registers)
4. Add polling loop based on channel scan rate
5. Publish data to Redis channel: `data:raw`
6. Add error handling and reconnection logic

**Acceptance Criteria**:
- Can connect to Modbus TCP device/simulator
- Reads configured registers at specified scan rate
- Publishes data to Redis in format: `{channelId, value, quality, timestamp}`

#### Step 1.2: Implement Data Router (Priority 1)
**Files to modify**:
- `services/data-router/src/websocket-server.js`
- `services/data-router/src/subscription-manager.js`

**Tasks**:
1. Subscribe to Redis channel: `data:raw`
2. Maintain client subscription map (clientId → channelIds[])
3. Route incoming data to subscribed WebSocket clients
4. Implement backpressure handling
5. Add connection lifecycle management

**Acceptance Criteria**:
- Receives data from Redis `data:raw` channel
- Routes data to WebSocket clients based on subscriptions
- Frontend widgets receive real-time updates

#### Step 1.3: Implement Storage Engine (Priority 1)
**Files to modify**:
- `services/storage-engine/src/adapters/timescaledb.js`
- `services/storage-engine/src/storage-manager.js`

**Tasks**:
1. Subscribe to Redis channel: `data:raw`
2. Evaluate storage rules for each data point
3. Batch data points (1000 points or 1 second)
4. Write batches to TimescaleDB `channel_data` table
5. Implement continuous storage mode first
6. Add error handling and retry logic

**Acceptance Criteria**:
- Receives data from Redis `data:raw` channel
- Writes data to TimescaleDB in batches
- Data persists and can be queried via SQL

**Estimated Time**: 5-7 days

---

### Phase 2: Historical Data Retrieval (Week 2-3)
**Goal**: Display historical trends in the UI

#### Step 2.1: Implement Analytics Engine Queries (Priority 2)
**Files to modify**:
- `services/analytics-engine/src/routes/historical.py`
- `services/analytics-engine/src/services/query_service.py`

**Tasks**:
1. Implement raw data query from TimescaleDB
2. Implement aggregated query (time_bucket)
3. Add multi-channel query support
4. Implement statistical aggregations (avg, min, max, stddev)
5. Add pagination and time range filtering

**Acceptance Criteria**:
- `GET /api/v1/analytics/historical/raw` returns actual data
- `GET /api/v1/analytics/historical/aggregated` returns aggregated data
- Frontend TrendGraph displays historical data

#### Step 2.2: Connect Frontend to Real Data (Priority 2)
**Files to modify**:
- `frontend-v2/src/components/widgets/TrendGraph.tsx`
- `frontend-v2/src/services/api.ts`

**Tasks**:
1. Update TrendGraph to fetch historical data on mount
2. Combine historical data with real-time WebSocket updates
3. Implement time range selector
4. Add loading states and error handling

**Acceptance Criteria**:
- TrendGraph shows historical data on load
- Real-time updates append to historical data
- Time range selector fetches new data

**Estimated Time**: 3-5 days

---

### Phase 3: Additional Protocols (Week 3-4)
**Goal**: Support multiple data sources

#### Step 3.1: Implement OPC UA Collector (Priority 3)
**Files to modify**:
- `services/collector/src/protocols/opcua.js`

**Tasks**:
1. Install `node-opcua` npm package
2. Implement OPC UA client connection
3. Implement node browsing
4. Implement subscription-based data collection
5. Map OPC UA nodes to ParX channels

**Acceptance Criteria**:
- Can connect to OPC UA server
- Subscribes to configured nodes
- Publishes data to Redis

#### Step 3.2: Implement MQTT Collector (Priority 3)
**Files to modify**:
- `services/collector/src/protocols/mqtt.js`

**Tasks**:
1. Install `mqtt` npm package
2. Implement MQTT client connection
3. Implement topic subscription
4. Parse JSON payloads
5. Map MQTT topics to ParX channels

**Acceptance Criteria**:
- Can connect to MQTT broker
- Subscribes to configured topics
- Publishes data to Redis

**Estimated Time**: 5-7 days

---

### Phase 4: Advanced Storage Modes (Week 4-5)
**Goal**: Implement intelligent data storage

#### Step 4.1: Implement Change-Based Storage (Priority 4)
**Files to modify**:
- `services/storage-engine/src/storage-manager.js`

**Tasks**:
1. Track last stored value per channel
2. Calculate deadband (absolute or percentage)
3. Only store if value change exceeds deadband
4. Implement time-based override (max time between samples)

**Acceptance Criteria**:
- Only stores data when value changes significantly
- Reduces storage by 50-90% for stable signals

#### Step 4.2: Implement Event-Based Storage (Priority 4)
**Files to modify**:
- `services/storage-engine/src/storage-manager.js`

**Tasks**:
1. Detect rising/falling edges on digital signals
2. Store timestamp of edge transitions
3. Implement edge filtering (debounce)

**Acceptance Criteria**:
- Stores only on signal transitions
- Useful for event logging

**Estimated Time**: 3-4 days

---

### Phase 5: Testing & Optimization (Week 5-6)
**Goal**: Ensure system reliability and performance

#### Step 5.1: Integration Testing (Priority 2)
**Files to create**:
- `tests/integration/test-data-flow.js`
- `tests/integration/test-protocols.js`

**Tasks**:
1. Test Modbus → Redis → WebSocket → UI flow
2. Test Modbus → Redis → Storage → Database flow
3. Test historical query → UI flow
4. Test multiple concurrent collectors
5. Test WebSocket reconnection
6. Test storage engine backpressure

**Acceptance Criteria**:
- All integration tests pass
- Data flows end-to-end reliably

#### Step 5.2: Performance Testing (Priority 3)
**Files to create**:
- `tests/performance/test-throughput.js`
- `tests/performance/test-latency.js`

**Tasks**:
1. Test 10,000 points/second throughput
2. Measure WebSocket latency (<150ms)
3. Test storage engine batch performance
4. Test historical query performance (<3s for 8h)
5. Identify and fix bottlenecks

**Acceptance Criteria**:
- Meets all performance targets
- System stable under load

**Estimated Time**: 5-7 days

---

## Detailed Implementation Guide

### 1. Modbus TCP Collector Implementation

**File**: `services/collector/src/protocols/modbus.js`

```javascript
import ModbusRTU from 'modbus-serial';
import { createLogger } from '../../../../shared/utils/logger.js';
import { getRedisClient } from '../../../../shared/utils/redis-client.js';

const logger = createLogger('modbus-collector');

export class ModbusCollector {
  constructor(connection, channels) {
    this.connection = connection;
    this.channels = channels;
    this.client = new ModbusRTU();
    this.isConnected = false;
    this.pollingIntervals = new Map();
  }

  async connect() {
    try {
      const { host, port, unitId } = this.connection.config;
      await this.client.connectTCP(host, { port: port || 502 });
      this.client.setID(unitId || 1);
      this.isConnected = true;
      logger.info(`Connected to Modbus device: ${host}:${port}`);
      return true;
    } catch (error) {
      logger.error('Modbus connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async startPolling() {
    const redis = await getRedisClient();
    
    for (const channel of this.channels) {
      if (!channel.enabled) continue;
      
      const { address, dataType, scanRate } = channel.config;
      
      const pollFunction = async () => {
        try {
          let value;
          
          // Read based on data type
          if (dataType === 'float' || dataType === 'int32') {
            const result = await this.client.readHoldingRegisters(address, 2);
            value = this.parseFloat(result.data);
          } else if (dataType === 'int16') {
            const result = await this.client.readHoldingRegisters(address, 1);
            value = result.data[0];
          } else if (dataType === 'bool') {
            const result = await this.client.readCoils(address, 1);
            value = result.data[0] ? 1 : 0;
          }
          
          // Publish to Redis
          const dataPoint = {
            channelId: channel.id,
            value: value,
            quality: 'GOOD',
            timestamp: Date.now()
          };
          
          await redis.publish('data:raw', JSON.stringify(dataPoint));
          
        } catch (error) {
          logger.error(`Error reading channel ${channel.id}:`, error);
          
          // Publish bad quality
          const dataPoint = {
            channelId: channel.id,
            value: null,
            quality: 'BAD',
            timestamp: Date.now()
          };
          await redis.publish('data:raw', JSON.stringify(dataPoint));
        }
      };
      
      // Start polling at specified scan rate
      const intervalId = setInterval(pollFunction, scanRate || 1000);
      this.pollingIntervals.set(channel.id, intervalId);
      
      // Initial read
      pollFunction();
    }
    
    logger.info(`Started polling ${this.channels.length} channels`);
  }

  parseFloat(registers) {
    // Convert two 16-bit registers to 32-bit float (IEEE 754)
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeUInt16BE(registers[0], 0);
    buffer.writeUInt16BE(registers[1], 2);
    return buffer.readFloatBE(0);
  }

  async disconnect() {
    // Stop all polling
    for (const intervalId of this.pollingIntervals.values()) {
      clearInterval(intervalId);
    }
    this.pollingIntervals.clear();
    
    if (this.isConnected) {
      this.client.close(() => {
        logger.info('Modbus connection closed');
      });
    }
  }
}
```

### 2. Data Router WebSocket Implementation

**File**: `services/data-router/src/websocket-server.js`

```javascript
import { Server } from 'socket.io';
import { createLogger } from '../../../shared/utils/logger.js';
import { getRedisClient } from '../../../shared/utils/redis-client.js';

const logger = createLogger('websocket-server');

export class WebSocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });
    
    this.subscriptions = new Map(); // clientId → Set<channelId>
    this.setupRedisSubscriber();
    this.setupSocketHandlers();
  }

  async setupRedisSubscriber() {
    const redis = await getRedisClient();
    const subscriber = redis.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe('data:raw', (message) => {
      try {
        const dataPoint = JSON.parse(message);
        this.routeData(dataPoint);
      } catch (error) {
        logger.error('Error parsing Redis message:', error);
      }
    });
    
    logger.info('Subscribed to Redis data:raw channel');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.subscriptions.set(socket.id, new Set());
      
      socket.on('subscribe', (channelIds) => {
        const clientSubs = this.subscriptions.get(socket.id);
        channelIds.forEach(id => clientSubs.add(id));
        logger.info(`Client ${socket.id} subscribed to ${channelIds.length} channels`);
      });
      
      socket.on('unsubscribe', (channelIds) => {
        const clientSubs = this.subscriptions.get(socket.id);
        channelIds.forEach(id => clientSubs.delete(id));
        logger.info(`Client ${socket.id} unsubscribed from ${channelIds.length} channels`);
      });
      
      socket.on('disconnect', () => {
        this.subscriptions.delete(socket.id);
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  routeData(dataPoint) {
    const { channelId } = dataPoint;
    
    // Send to all subscribed clients
    for (const [socketId, channelIds] of this.subscriptions.entries()) {
      if (channelIds.has(channelId)) {
        this.io.to(socketId).emit('tagUpdate', dataPoint);
      }
    }
  }
}
```

### 3. Storage Engine TimescaleDB Implementation

**File**: `services/storage-engine/src/adapters/timescaledb.js`

```javascript
import { getDbPool } from '../../../../shared/utils/db-client.js';
import { createLogger } from '../../../../shared/utils/logger.js';

const logger = createLogger('timescaledb-adapter');

export class TimescaleDBAdapter {
  constructor() {
    this.batchBuffer = [];
    this.batchSize = 1000;
    this.batchTimeout = 1000; // 1 second
    this.batchTimer = null;
  }

  async initialize() {
    // Ensure hypertable exists
    const db = getDbPool();
    await db.query(`
      SELECT create_hypertable('channel_data', 'timestamp', 
        if_not_exists => TRUE,
        chunk_time_interval => INTERVAL '1 day'
      );
    `);
    
    // Start batch timer
    this.startBatchTimer();
    logger.info('TimescaleDB adapter initialized');
  }

  async write(dataPoint) {
    this.batchBuffer.push(dataPoint);
    
    if (this.batchBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.batchBuffer.length === 0) return;
    
    const batch = this.batchBuffer.splice(0, this.batchBuffer.length);
    
    try {
      const db = getDbPool();
      
      // Build multi-row insert
      const values = batch.map((dp, i) => {
        const offset = i * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      }).join(',');
      
      const params = batch.flatMap(dp => [
        dp.channelId,
        dp.value,
        dp.quality,
        new Date(dp.timestamp)
      ]);
      
      await db.query(`
        INSERT INTO channel_data (channel_id, value, quality, timestamp)
        VALUES ${values}
      `, params);
      
      logger.info(`Wrote ${batch.length} data points to TimescaleDB`);
      
    } catch (error) {
      logger.error('Error writing to TimescaleDB:', error);
      // Re-add to buffer for retry
      this.batchBuffer.unshift(...batch);
    }
  }

  startBatchTimer() {
    this.batchTimer = setInterval(() => {
      this.flush();
    }, this.batchTimeout);
  }

  async close() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    await this.flush();
  }
}
```

---

## Resource Requirements

### Development Team
- **1 Backend Developer**: Collector & Storage implementation (4-6 weeks)
- **1 Integration Developer**: Data Router & Analytics (3-4 weeks)
- **1 QA Engineer**: Testing & validation (2-3 weeks)

### Infrastructure
- **Development Environment**:
  - Modbus TCP simulator (ModbusPal or similar)
  - OPC UA server (Prosys OPC UA Simulation Server)
  - MQTT broker (Mosquitto)
  - PostgreSQL + TimescaleDB
  - Redis

- **Testing Environment**:
  - Load testing tools (k6, Artillery)
  - Real industrial devices (optional)

### Timeline
- **Phase 1 (Core)**: 2 weeks
- **Phase 2 (Historical)**: 1 week
- **Phase 3 (Protocols)**: 1-2 weeks
- **Phase 4 (Storage)**: 1 week
- **Phase 5 (Testing)**: 1-2 weeks

**Total**: 6-8 weeks to fully functional system

---

## Success Criteria

### Minimum Viable Product (MVP)
- ✅ Modbus TCP data collection working
- ✅ Real-time data streaming to UI
- ✅ Data storage in TimescaleDB
- ✅ Historical trend display
- ✅ Basic alarm detection
- ✅ Single protocol, single device

### Production Ready
- ✅ All 3 protocols working (Modbus, OPC UA, MQTT)
- ✅ Multiple concurrent devices
- ✅ All storage modes implemented
- ✅ Performance targets met
- ✅ Integration tests passing
- ✅ Documentation complete

---

## Risk Assessment

### High Risk
1. **Protocol Implementation Complexity**: OPC UA and MQTT have steep learning curves
   - **Mitigation**: Start with Modbus (simpler), use well-tested libraries

2. **Performance at Scale**: 10k points/second is challenging
   - **Mitigation**: Implement batching, use Redis for buffering, optimize queries

3. **TimescaleDB Learning Curve**: Team may not be familiar
   - **Mitigation**: Start with simple queries, leverage documentation

### Medium Risk
1. **WebSocket Stability**: Connection drops, reconnection logic
   - **Mitigation**: Implement robust reconnection, use Socket.io (handles this)

2. **Data Loss During Outages**: Network failures, service restarts
   - **Mitigation**: Disk-backed buffering already designed

### Low Risk
1. **UI Integration**: Frontend is already built
   - **Mitigation**: Well-defined interfaces, mock data already working

---

## Conclusion

ParX v1.2.1 has an **excellent foundation** with complete architecture, comprehensive UI, and solid infrastructure. The **critical gap** is implementing the actual data collection, routing, and storage logic.

**Recommended Approach**:
1. **Focus on Phase 1 first**: Get Modbus → Redis → WebSocket → UI working
2. **Validate with real device**: Use Modbus simulator or real PLC
3. **Then add storage**: Get data into TimescaleDB
4. **Then add historical**: Display trends from database
5. **Then expand**: Add more protocols and features

**Estimated Time to MVP**: 2-3 weeks with focused development  
**Estimated Time to Production**: 6-8 weeks with full feature set

The system is **well-architected** and **ready for implementation**. The hard design work is done; now it's execution.
