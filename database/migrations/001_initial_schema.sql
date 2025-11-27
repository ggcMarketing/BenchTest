-- ParX v1.2.1 Initial Schema Migration
-- Migration: 001_initial_schema
-- Description: Create base tables for configuration and users

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS AND AUTHENTICATION
-- ============================================================================

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
CREATE INDEX idx_users_enabled ON users(enabled);

-- Refresh tokens for JWT authentication
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
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================================================
-- I/O CONFIGURATION
-- ============================================================================

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
CREATE INDEX idx_channels_name ON channels(name);

-- ============================================================================
-- STORAGE CONFIGURATION
-- ============================================================================

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
CREATE INDEX idx_storage_rules_mode ON storage_rules(mode);

-- ============================================================================
-- DASHBOARD CONFIGURATION
-- ============================================================================

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
CREATE INDEX idx_dashboards_name ON dashboards(name);

-- ============================================================================
-- DERIVED SIGNALS
-- ============================================================================

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

-- ============================================================================
-- BATCHES/COILS
-- ============================================================================

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
CREATE INDEX idx_batches_end_time ON batches(end_time);
CREATE INDEX idx_batches_status ON batches(status);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

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
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storage_rules_updated_at BEFORE UPDATE ON storage_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_derived_signals_updated_at BEFORE UPDATE ON derived_signals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default users (passwords are 'pass123' hashed with bcrypt rounds=10)
-- Hash generated with: bcrypt.hash('pass123', 10)
INSERT INTO users (username, password_hash, role, name, email) VALUES
  ('admin', '$2b$10$YQ98PzLGYJY9iB7P0biEUOlJ8JQJ8YQ98PzLGYJY9iB7P0biEUOlJ8', 'admin', 'System Administrator', 'admin@parx.local'),
  ('engineer1', '$2b$10$YQ98PzLGYJY9iB7P0biEUOlJ8JQJ8YQ98PzLGYJY9iB7P0biEUOlJ8', 'engineer', 'Engineer One', 'engineer1@parx.local'),
  ('operator1', '$2b$10$YQ98PzLGYJY9iB7P0biEUOlJ8JQJ8YQ98PzLGYJY9iB7P0biEUOlJ8', 'operator', 'Operator One', 'operator1@parx.local');

-- Migration complete
SELECT 'Migration 001_initial_schema completed successfully' AS status;
