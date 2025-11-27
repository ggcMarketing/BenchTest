# ParX v1.2.1 Database Schema

## Overview

ParX v1.2.1 uses multiple databases for different purposes:

- **PostgreSQL**: Configuration, users, metadata
- **TimescaleDB**: Time-series data (extends PostgreSQL)
- **Redis**: Caching, pub/sub, session storage

---

## PostgreSQL Schema (Configuration Database)

### users

User accounts and authentication.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'engineer', 'operator')),
  name VARCHAR(100),
  email VARCHAR(100),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
```

### refresh_tokens

JWT refresh tokens for authentication.

```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT false
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

### channels

I/O channel configurations.

```sql
CREATE TABLE channels (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  protocol VARCHAR(20) NOT NULL CHECK (protocol IN ('modbus', 'ethernet-ip', 'opcua', 'mqtt', 'egd')),
  enabled BOOLEAN DEFAULT true,
  config JSONB NOT NULL,
  metadata JSONB,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_channels_protocol ON channels(protocol);
CREATE INDEX idx_channels_enabled ON channels(enabled);
CREATE INDEX idx_channels_config ON channels USING GIN (config);
```

**Example config JSONB**:
```json
{
  "modbus": {
    "host": "192.168.1.10",
    "port": 502,
    "unitId": 1,
    "register": 40001,
    "dataType": "float",
    "scaling": {
      "factor": 0.1,
      "offset": 0
    }
  },
  "ethernet-ip": {
    "host": "192.168.1.20",
    "slot": 0,
    "tagName": "Program:MainProgram.LineSpeed",
    "dataType": "REAL"
  },
  "opcua": {
    "endpoint": "opc.tcp://192.168.1.30:4840",
    "nodeId": "ns=2;s=LineSpeed",
    "securityMode": "None"
  }
}
```

### storage_rules

Storage configuration rules.

```sql
CREATE TABLE storage_rules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  backend VARCHAR(20) NOT NULL CHECK (backend IN ('timescaledb', 'influxdb', 'file')),
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('continuous', 'change', 'event', 'trigger')),
  channels TEXT[] NOT NULL,
  config JSONB NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_storage_rules_enabled ON storage_rules(enabled);
CREATE INDEX idx_storage_rules_backend ON storage_rules(backend);
```

**Example config JSONB**:
```json
{
  "continuous": {
    "interval": 1000,
    "retention": "7d"
  },
  "change": {
    "deadband": 0.5,
    "retention": "30d"
  },
  "event": {
    "trigger": {
      "type": "signal",
      "channel": "ch-coil-start",
      "condition": "rising_edge"
    }
  },
  "file": {
    "format": "csv",
    "path": "/data/coils",
    "naming": "coil_{timestamp}_{coilId}.csv",
    "rotation": {
      "type": "size",
      "maxSize": "100MB"
    }
  }
}
```

### dashboards

Dashboard configurations.

```sql
CREATE TABLE dashboards (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  shared BOOLEAN DEFAULT false,
  layout JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX idx_dashboards_shared ON dashboards(shared);
```

**Example layout JSONB**:
```json
{
  "grid": {
    "cols": 12,
    "rows": 8
  },
  "widgets": [
    {
      "id": "widget-001",
      "type": "value-card",
      "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
      "config": {
        "channel": "ch-001",
        "title": "Line Speed",
        "units": "m/min",
        "decimals": 1
      }
    }
  ]
}
```

### derived_signals

Derived signal definitions.

```sql
CREATE TABLE derived_signals (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  formula TEXT NOT NULL,
  units VARCHAR(20),
  description TEXT,
  source_channels TEXT[] NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_derived_signals_name ON derived_signals(name);
```

### batches

Batch/coil metadata.

```sql
CREATE TABLE batches (
  id VARCHAR(50) PRIMARY KEY,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'aborted')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_batches_start_time ON batches(start_time);
CREATE INDEX idx_batches_status ON batches(status);
```

### audit_log

Audit trail for configuration changes.

```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(50),
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
```

---

## TimescaleDB Schema (Time-Series Database)

### channel_data

Main time-series data table (hypertable).

```sql
CREATE TABLE channel_data (
  time TIMESTAMPTZ NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  quality VARCHAR(10) NOT NULL CHECK (quality IN ('GOOD', 'BAD', 'UNCERTAIN')),
  CONSTRAINT channel_data_pkey PRIMARY KEY (time, channel_id)
);

-- Convert to hypertable
SELECT create_hypertable('channel_data', 'time');

-- Create indexes
CREATE INDEX idx_channel_data_channel_id ON channel_data(channel_id, time DESC);

-- Enable compression
ALTER TABLE channel_data SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'channel_id',
  timescaledb.compress_orderby = 'time DESC'
);

-- Add compression policy (compress data older than 7 days)
SELECT add_compression_policy('channel_data', INTERVAL '7 days');

-- Add retention policy (drop data older than 90 days)
SELECT add_retention_policy('channel_data', INTERVAL '90 days');
```

### channel_data_1s

1-second aggregated data (continuous aggregate).

```sql
CREATE MATERIALIZED VIEW channel_data_1s
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 second', time) AS bucket,
  channel_id,
  AVG(value) AS avg_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  COUNT(*) AS sample_count
FROM channel_data
GROUP BY bucket, channel_id;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('channel_data_1s',
  start_offset => INTERVAL '1 hour',
  end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute');
```

### channel_data_1m

1-minute aggregated data (continuous aggregate).

```sql
CREATE MATERIALIZED VIEW channel_data_1m
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 minute', time) AS bucket,
  channel_id,
  AVG(value) AS avg_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  STDDEV(value) AS stddev_value,
  COUNT(*) AS sample_count
FROM channel_data
GROUP BY bucket, channel_id;

SELECT add_continuous_aggregate_policy('channel_data_1m',
  start_offset => INTERVAL '1 day',
  end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '5 minutes');
```

### alarms

Alarm events (hypertable).

```sql
CREATE TABLE alarms (
  time TIMESTAMPTZ NOT NULL,
  id VARCHAR(50) NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by INTEGER,
  acknowledged_at TIMESTAMPTZ,
  CONSTRAINT alarms_pkey PRIMARY KEY (time, id)
);

SELECT create_hypertable('alarms', 'time');

CREATE INDEX idx_alarms_channel_id ON alarms(channel_id, time DESC);
CREATE INDEX idx_alarms_severity ON alarms(severity, time DESC);
CREATE INDEX idx_alarms_acknowledged ON alarms(acknowledged);

-- Retention policy (keep alarms for 1 year)
SELECT add_retention_policy('alarms', INTERVAL '1 year');
```

### batch_data

Batch-specific time-series data.

```sql
CREATE TABLE batch_data (
  time TIMESTAMPTZ NOT NULL,
  batch_id VARCHAR(50) NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  quality VARCHAR(10) NOT NULL,
  CONSTRAINT batch_data_pkey PRIMARY KEY (time, batch_id, channel_id)
);

SELECT create_hypertable('batch_data', 'time');

CREATE INDEX idx_batch_data_batch_id ON batch_data(batch_id, time DESC);
```

---

## Redis Data Structures

### Signal Registry

**Key**: `signal:registry:{channelId}`  
**Type**: Hash  
**TTL**: None (persistent)

```json
{
  "id": "ch-001",
  "name": "Line Speed",
  "protocol": "modbus",
  "units": "m/min",
  "dataType": "float",
  "lastValue": "125.5",
  "lastQuality": "GOOD",
  "lastUpdate": "1705315200000"
}
```

### Live Data Cache

**Key**: `live:{channelId}`  
**Type**: String (JSON)  
**TTL**: 60 seconds

```json
{
  "value": 125.5,
  "quality": "GOOD",
  "timestamp": 1705315200000
}
```

### WebSocket Subscriptions

**Key**: `subscriptions:{socketId}`  
**Type**: Set  
**TTL**: Session lifetime

```
SADD subscriptions:abc123 ch-001 ch-002 ch-003
```

### Pub/Sub Channels

**Channel**: `channel:updates`  
**Message Format**:
```json
{
  "channelId": "ch-001",
  "value": 125.5,
  "quality": "GOOD",
  "timestamp": 1705315200000
}
```

**Channel**: `alarms`  
**Message Format**:
```json
{
  "id": "alarm-001",
  "channelId": "ch-001",
  "severity": "WARNING",
  "message": "Line speed high",
  "timestamp": 1705315200000
}
```

### Session Storage

**Key**: `session:{sessionId}`  
**Type**: Hash  
**TTL**: 7 days

```json
{
  "userId": "1",
  "username": "operator1",
  "role": "operator",
  "loginTime": "1705315200000"
}
```

---

## Migration Scripts

### Initial Migration (v1.2.1.001)

```sql
-- Create all tables in order
-- 1. Users and auth
-- 2. Configuration tables
-- 3. Time-series tables
-- 4. Indexes and constraints
-- 5. Policies and aggregates
```

### Migration from v1.0 to v1.2.1

```sql
-- Migrate existing mock data to new schema
-- Convert old dashboard format to new layout
-- Import historical data into TimescaleDB
```

---

## Backup Strategy

### PostgreSQL
- Daily full backup
- Continuous WAL archiving
- Point-in-time recovery enabled

### TimescaleDB
- Continuous backup with pg_basebackup
- Compressed chunk backups
- S3/GCS archival for old data

### Redis
- RDB snapshots every 15 minutes
- AOF for durability
- Replica for high availability

---

## Performance Considerations

### Indexing Strategy
- B-tree indexes for exact lookups
- GIN indexes for JSONB queries
- Time-based indexes for range queries

### Partitioning
- TimescaleDB automatic time-based partitioning
- Chunk interval: 1 day (configurable)

### Query Optimization
- Use continuous aggregates for common queries
- Leverage compression for historical data
- Cache frequently accessed data in Redis

### Write Optimization
- Batch inserts (1000 rows at a time)
- Use COPY for bulk imports
- Async writes with buffering
