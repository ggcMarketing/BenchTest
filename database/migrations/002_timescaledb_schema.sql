-- ParX v1.2.1 TimescaleDB Schema Migration
-- Migration: 002_timescaledb_schema
-- Description: Create time-series tables and hypertables

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================================
-- CHANNEL DATA (Main time-series table)
-- ============================================================================

CREATE TABLE channel_data (
  time TIMESTAMPTZ NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  quality VARCHAR(10) NOT NULL CHECK (quality IN ('GOOD', 'BAD', 'UNCERTAIN')),
  CONSTRAINT channel_data_pkey PRIMARY KEY (time, channel_id)
);

-- Convert to hypertable (1-day chunks)
SELECT create_hypertable('channel_data', 'time', chunk_time_interval => INTERVAL '1 day');

-- Create indexes
CREATE INDEX idx_channel_data_channel_id ON channel_data(channel_id, time DESC);
CREATE INDEX idx_channel_data_time ON channel_data(time DESC);

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

-- ============================================================================
-- CONTINUOUS AGGREGATES
-- ============================================================================

-- 1-second aggregates
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

-- Add refresh policy for 1-second aggregates
SELECT add_continuous_aggregate_policy('channel_data_1s',
  start_offset => INTERVAL '1 hour',
  end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute');

-- 1-minute aggregates
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

-- Add refresh policy for 1-minute aggregates
SELECT add_continuous_aggregate_policy('channel_data_1m',
  start_offset => INTERVAL '1 day',
  end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '5 minutes');

-- 1-hour aggregates
CREATE MATERIALIZED VIEW channel_data_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  channel_id,
  AVG(value) AS avg_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  STDDEV(value) AS stddev_value,
  COUNT(*) AS sample_count
FROM channel_data
GROUP BY bucket, channel_id;

-- Add refresh policy for 1-hour aggregates
SELECT add_continuous_aggregate_policy('channel_data_1h',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- ============================================================================
-- ALARMS
-- ============================================================================

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

-- Convert to hypertable
SELECT create_hypertable('alarms', 'time', chunk_time_interval => INTERVAL '7 days');

-- Create indexes
CREATE INDEX idx_alarms_channel_id ON alarms(channel_id, time DESC);
CREATE INDEX idx_alarms_severity ON alarms(severity, time DESC);
CREATE INDEX idx_alarms_acknowledged ON alarms(acknowledged);

-- Retention policy (keep alarms for 1 year)
SELECT add_retention_policy('alarms', INTERVAL '1 year');

-- ============================================================================
-- BATCH DATA
-- ============================================================================

CREATE TABLE batch_data (
  time TIMESTAMPTZ NOT NULL,
  batch_id VARCHAR(50) NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  quality VARCHAR(10) NOT NULL CHECK (quality IN ('GOOD', 'BAD', 'UNCERTAIN')),
  CONSTRAINT batch_data_pkey PRIMARY KEY (time, batch_id, channel_id)
);

-- Convert to hypertable
SELECT create_hypertable('batch_data', 'time', chunk_time_interval => INTERVAL '1 day');

-- Create indexes
CREATE INDEX idx_batch_data_batch_id ON batch_data(batch_id, time DESC);
CREATE INDEX idx_batch_data_channel_id ON batch_data(channel_id, time DESC);

-- Enable compression
ALTER TABLE batch_data SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'batch_id, channel_id',
  timescaledb.compress_orderby = 'time DESC'
);

-- Add compression policy
SELECT add_compression_policy('batch_data', INTERVAL '30 days');

-- Retention policy (keep batch data for 2 years)
SELECT add_retention_policy('batch_data', INTERVAL '2 years');

-- Migration complete
SELECT 'Migration 002_timescaledb_schema completed successfully' AS status;
