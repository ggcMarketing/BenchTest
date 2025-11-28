# Phase 1 Testing Guide - Core Data Collection

This guide walks you through testing the core data collection functionality implemented in Phase 1.

## Prerequisites

### Required Services
- PostgreSQL (with TimescaleDB extension)
- Redis
- Node.js 18+

### Required Tools
- **Modbus TCP Simulator** (choose one):
  - **ModbusPal** (Recommended): https://sourceforge.net/projects/modbuspal/
  - **diagslave**: `diagslave -m tcp -p 502`
  - **pymodbus simulator**: `pip install pymodbus && pymodbus.simulator`

## Setup Steps

### 1. Start Infrastructure

```bash
# Start PostgreSQL and Redis with Docker Compose
docker-compose up -d postgres redis

# Wait for services to be ready
sleep 5
```

### 2. Initialize Database

```bash
# Run database migrations
cd database
npm install
npm run migrate

# Verify TimescaleDB extension
psql -h localhost -U parx -d parx -c "SELECT * FROM pg_extension WHERE extname = 'timescaledb';"
```

### 3. Setup Test Channels

```bash
# Run the test channel setup script
node scripts/setup-test-channels.js
```

This creates:
- 1 test interface (Modbus TCP)
- 1 test connection (localhost:502)
- 6 test channels:
  - Temperature Sensor (40001, float, 1s scan)
  - Pressure Sensor (40003, float, 1s scan)
  - Motor Speed (40005, int16, 500ms scan)
  - Flow Rate (40006, float, 2s scan)
  - Tank Level (40008, int16, 5s scan)
  - Pump Status (coil 1, bool, 1s scan)
- 1 storage rule (continuous mode, all channels)

### 4. Start Modbus Simulator

#### Option A: ModbusPal (GUI)

1. Download and run ModbusPal
2. Add a Modbus slave with Unit ID = 1
3. Add holding registers:
   - 40001-40002: Float (temperature, e.g., 25.5°C)
   - 40003-40004: Float (pressure, e.g., 14.7 PSI)
   - 40005: Int16 (speed, e.g., 1200 RPM)
   - 40006-40007: Float (flow, e.g., 5.2 L/min)
   - 40008: Int16 (level, e.g., 75%)
4. Add coil:
   - 1: Boolean (pump status, e.g., true)
5. Start the simulator on port 502

#### Option B: diagslave (CLI)

```bash
# Install diagslave (if not installed)
# On Ubuntu: sudo apt-get install diagslave
# On macOS: brew install diagslave

# Start simulator
diagslave -m tcp -p 502
```

Then manually set values using a Modbus client or let it use default values.

#### Option C: Python Simulator

```bash
# Install pymodbus
pip install pymodbus

# Create a simple simulator script
cat > modbus_simulator.py << 'EOF'
from pymodbus.server.sync import StartTcpServer
from pymodbus.datastore import ModbusSequentialDataBlock, ModbusSlaveContext, ModbusServerContext
import random
import threading
import time

def update_values(context):
    """Simulate changing values"""
    while True:
        # Update holding registers with simulated values
        context[0].setValues(3, 0, [int(25.5 * 100)])  # Temperature * 100
        context[0].setValues(3, 2, [int(14.7 * 100)])  # Pressure * 100
        context[0].setValues(3, 4, [1200 + random.randint(-50, 50)])  # Speed
        context[0].setValues(3, 5, [int(5.2 * 100)])  # Flow * 100
        context[0].setValues(3, 7, [75 + random.randint(-5, 5)])  # Level
        
        # Update coil
        context[0].setValues(1, 0, [True])
        
        time.sleep(1)

# Create data blocks
store = ModbusSlaveContext(
    di=ModbusSequentialDataBlock(0, [0]*100),
    co=ModbusSequentialDataBlock(0, [0]*100),
    hr=ModbusSequentialDataBlock(0, [0]*100),
    ir=ModbusSequentialDataBlock(0, [0]*100)
)

context = ModbusServerContext(slaves=store, single=True)

# Start update thread
update_thread = threading.Thread(target=update_values, args=(context,), daemon=True)
update_thread.start()

# Start server
print("Starting Modbus TCP server on port 502...")
StartTcpServer(context, address=("0.0.0.0", 502))
EOF

# Run simulator (requires sudo for port 502)
sudo python modbus_simulator.py
```

### 5. Start ParX Services

Open 3 terminal windows:

#### Terminal 1: Collector Service
```bash
cd services/collector
npm install
npm start
```

Expected output:
```
[collector] Collector service listening on port 3002
[collector] Database connection established
[collector] Redis connection established
[collector] Collector manager initialized
[collector] Loading 6 enabled channels
[modbus-protocol] Modbus connection established: localhost:502
[collector-manager] Channel started: test-modbus-interface.test-modbus-connection.temperature (modbus)
[collector-manager] Polling started for test-modbus-interface.test-modbus-connection.temperature: 1000ms
...
```

#### Terminal 2: Data Router Service
```bash
cd services/data-router
npm install
npm start
```

Expected output:
```
[data-router] Data Router listening on port 3001
[data-router] WebSocket server ready
[data-router] Redis subscriber initialized
```

#### Terminal 3: Storage Engine Service
```bash
cd services/storage-engine
npm install
npm start
```

Expected output:
```
[storage-engine] Storage Engine listening on port 3003
[storage-engine] TimescaleDB adapter initialized
[storage-engine] Storage manager initialized
```

### 6. Start Frontend

```bash
cd frontend-v2
npm install
npm run dev
```

Open browser to http://localhost:5173

## Testing Checklist

### ✅ Test 1: Verify Data Collection

**Check Collector Logs:**
```bash
# Should see polling messages
[collector-manager] Data published: test-modbus-interface.test-modbus-connection.temperature = 25.5
```

**Check Redis:**
```bash
redis-cli
> SUBSCRIBE data:raw
# Should see messages like:
# {"channelId":"test-modbus-interface.test-modbus-connection.temperature","value":25.5,"quality":"GOOD","timestamp":1701234567890}
```

**Expected Result:** ✅ Data is being collected and published to Redis

---

### ✅ Test 2: Verify Real-time Streaming

**Open Browser Console** (F12) and check WebSocket connection:
```javascript
// Should see:
WebSocket connected
```

**Check Data Router Logs:**
```bash
[data-router] Client connected: <socket-id>
[data-router] Socket <socket-id> subscribing to 6 channel(s)
[data-router] Broadcasted update for test-modbus-interface.test-modbus-connection.temperature to 1 client(s)
```

**Expected Result:** ✅ WebSocket is connected and receiving data

---

### ✅ Test 3: Verify Data Storage

**Check Storage Engine Logs:**
```bash
[timescaledb-adapter] Flushed 1000 data points to TimescaleDB
```

**Query Database:**
```bash
psql -h localhost -U parx -d parx

-- Check recent data
SELECT 
  channel_id,
  value,
  quality,
  time
FROM channel_data
ORDER BY time DESC
LIMIT 10;

-- Check data count per channel
SELECT 
  channel_id,
  COUNT(*) as point_count,
  MIN(time) as first_point,
  MAX(time) as last_point
FROM channel_data
GROUP BY channel_id;
```

**Expected Result:** ✅ Data is being stored in TimescaleDB

---

### ✅ Test 4: Verify Dashboard Widgets

1. **Login to Frontend** (http://localhost:5173)
   - Username: `admin`
   - Password: `admin123`

2. **Go to Dashboard Builder**

3. **Add a ValueCard Widget**
   - Click "Add Widget" → "Value Card"
   - Click settings icon on widget
   - Select a tag (e.g., "Temperature Sensor")
   - Set title: "Temperature"
   - Set units: "°C"
   - Save configuration

4. **Verify Real-time Updates**
   - Widget should show current value
   - Value should update every second
   - Quality indicator should show "GOOD"

**Expected Result:** ✅ Widget displays real-time data

---

### ✅ Test 5: Verify Trend Graph

1. **Add a TrendGraph Widget**
   - Click "Add Widget" → "Trend Graph"
   - Click settings icon
   - Select multiple tags (Temperature, Pressure, Speed)
   - Set title: "Process Trends"
   - Save configuration

2. **Verify Historical Data**
   - Graph should show historical data (if available)
   - Real-time data should append to the graph
   - Multiple lines should be visible with different colors

**Expected Result:** ✅ Trend graph displays multiple channels

---

### ✅ Test 6: Verify Historical Queries

**Test via API:**
```bash
# Get historical data for last hour
curl "http://localhost:3004/api/v1/analytics/historical/raw?channelId=test-modbus-interface.test-modbus-connection.temperature&startTime=$(date -d '1 hour ago' +%s)000&endTime=$(date +%s)000"
```

**Expected Response:**
```json
{
  "channelId": "test-modbus-interface.test-modbus-connection.temperature",
  "data": [
    {
      "timestamp": 1701234567890,
      "value": 25.5,
      "quality": "GOOD"
    },
    ...
  ],
  "count": 3600
}
```

**Expected Result:** ✅ Historical data can be queried

---

## Performance Verification

### Test Data Throughput

```bash
# Check collector stats
curl http://localhost:3002/status

# Expected output:
{
  "activeChannels": 6,
  "pollingChannels": 6,
  "channels": [...]
}

# Check storage stats
curl http://localhost:3003/stats

# Expected output:
{
  "pointsReceived": 12000,
  "pointsStored": 12000,
  "errors": 0,
  "activeRules": 1,
  "queueSize": 0
}
```

### Test WebSocket Latency

Open browser console and run:
```javascript
const start = Date.now();
websocketService.subscribe('test-modbus-interface.test-modbus-connection.temperature', (data) => {
  const latency = Date.now() - data.timestamp;
  console.log(`Latency: ${latency}ms`);
});
```

**Expected:** Latency < 150ms

---

## Troubleshooting

### Issue: Collector can't connect to Modbus

**Symptoms:**
```
[modbus-protocol] Modbus connection failed: localhost:502
```

**Solutions:**
1. Verify Modbus simulator is running: `netstat -an | grep 502`
2. Check firewall settings
3. Try connecting with a Modbus client tool
4. Check simulator logs

---

### Issue: No data in Redis

**Symptoms:**
```
redis-cli SUBSCRIBE data:raw
# No messages received
```

**Solutions:**
1. Check collector logs for errors
2. Verify channels are enabled in database
3. Check Redis connection: `redis-cli PING`
4. Restart collector service

---

### Issue: WebSocket not connecting

**Symptoms:**
```
WebSocket disconnected
```

**Solutions:**
1. Verify data-router is running on port 3001
2. Check CORS settings in data-router
3. Check browser console for errors
4. Verify `VITE_DATA_ROUTER_URL` in frontend .env

---

### Issue: No data in TimescaleDB

**Symptoms:**
```sql
SELECT COUNT(*) FROM channel_data;
-- Returns 0
```

**Solutions:**
1. Check storage-engine logs for errors
2. Verify storage rules are enabled
3. Check TimescaleDB connection
4. Verify hypertable exists: `\d+ channel_data`

---

## Success Criteria

Phase 1 is complete when:

- ✅ Collector successfully reads from Modbus simulator
- ✅ Data is published to Redis `data:raw` channel
- ✅ Data Router receives data and broadcasts via WebSocket
- ✅ Storage Engine writes data to TimescaleDB
- ✅ Frontend widgets display real-time data
- ✅ Historical data can be queried
- ✅ System runs stably for 10+ minutes
- ✅ Latency < 150ms from collector to UI
- ✅ No data loss or errors in logs

---

## Next Steps

Once Phase 1 is complete:

1. **Phase 2**: Implement historical data retrieval in Analytics Engine
2. **Phase 3**: Add OPC UA and MQTT protocol support
3. **Phase 4**: Implement change-based and event-based storage
4. **Phase 5**: Comprehensive testing and optimization

---

## Quick Reference

### Service Ports
- Admin API: 3000
- Data Router: 3001
- Collector: 3002
- Storage Engine: 3003
- Analytics Engine: 3004
- Frontend: 5173
- PostgreSQL: 5432
- Redis: 6379
- Modbus Simulator: 502

### Health Check URLs
- http://localhost:3002/health (Collector)
- http://localhost:3001/health (Data Router)
- http://localhost:3003/health (Storage Engine)

### Log Locations
- `services/collector/logs/`
- `services/data-router/logs/`
- `services/storage-engine/logs/`
