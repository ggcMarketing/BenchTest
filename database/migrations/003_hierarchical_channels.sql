-- ParX v1.2.1 Hierarchical Channel Configuration
-- Migration: 003_hierarchical_channels
-- Description: Add support for Interface → Connection → Channel hierarchy

-- ============================================================================
-- INTERFACES (Protocol Types)
-- ============================================================================

CREATE TABLE interfaces (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  protocol VARCHAR(20) NOT NULL CHECK (protocol IN ('modbus', 'ethernet-ip', 'opcua', 'mqtt', 'egd')),
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interfaces_protocol ON interfaces(protocol);
CREATE INDEX idx_interfaces_enabled ON interfaces(enabled);

-- ============================================================================
-- CONNECTIONS (Device/Module Connections)
-- ============================================================================

CREATE TABLE connections (
  id VARCHAR(50) PRIMARY KEY,
  interface_id VARCHAR(50) NOT NULL REFERENCES interfaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  config JSONB NOT NULL,
  metadata JSONB,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_connections_interface_id ON connections(interface_id);
CREATE INDEX idx_connections_enabled ON connections(enabled);

-- ============================================================================
-- UPDATE CHANNELS TABLE
-- ============================================================================

-- Add connection_id to existing channels table
ALTER TABLE channels ADD COLUMN connection_id VARCHAR(50) REFERENCES connections(id) ON DELETE CASCADE;
ALTER TABLE channels ADD COLUMN interface_id VARCHAR(50) REFERENCES interfaces(id) ON DELETE CASCADE;

CREATE INDEX idx_channels_connection_id ON channels(connection_id);
CREATE INDEX idx_channels_interface_id ON channels(interface_id);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Sample Modbus Interface
INSERT INTO interfaces (id, name, protocol, description, enabled, config) VALUES
  ('if-modbus-1', 'Modbus TCP Interface', 'modbus', 'Primary Modbus TCP interface for PLCs', true, '{"timeout": 5000, "retries": 3}');

-- Sample Modbus Connection
INSERT INTO connections (id, interface_id, name, description, enabled, config) VALUES
  ('conn-plc-1', 'if-modbus-1', 'PLC-001', 'Main production line PLC', true, '{"host": "192.168.1.100", "port": 502, "unitId": 1}');

-- Sample Channels
INSERT INTO channels (id, name, protocol, enabled, config, metadata, interface_id, connection_id) VALUES
  ('ch-temp-1', 'Temperature Sensor 1', 'modbus', true, 
   '{"address": 40001, "dataType": "float", "scanRate": 1000}',
   '{"units": "°C", "min": 0, "max": 100}',
   'if-modbus-1', 'conn-plc-1'),
  ('ch-pressure-1', 'Pressure Sensor 1', 'modbus', true,
   '{"address": 40003, "dataType": "float", "scanRate": 1000}',
   '{"units": "PSI", "min": 0, "max": 150}',
   'if-modbus-1', 'conn-plc-1');

-- Sample OPC UA Interface
INSERT INTO interfaces (id, name, protocol, description, enabled, config) VALUES
  ('if-opcua-1', 'OPC UA Interface', 'opcua', 'OPC UA interface for SCADA systems', true, '{"securityMode": "None", "securityPolicy": "None"}');

-- Sample OPC UA Connection
INSERT INTO connections (id, interface_id, name, description, enabled, config) VALUES
  ('conn-scada-1', 'if-opcua-1', 'SCADA-001', 'Main SCADA server', true, '{"endpoint": "opc.tcp://192.168.1.200:4840", "namespace": 2}');

-- Sample MQTT Interface
INSERT INTO interfaces (id, name, protocol, description, enabled, config) VALUES
  ('if-mqtt-1', 'MQTT Interface', 'mqtt', 'MQTT broker for IoT devices', true, '{"qos": 1, "retain": false}');

-- Sample MQTT Connection
INSERT INTO connections (id, interface_id, name, description, enabled, config) VALUES
  ('conn-mqtt-broker-1', 'if-mqtt-1', 'IoT Broker', 'Main MQTT broker', true, '{"broker": "mqtt://192.168.1.50:1883", "clientId": "parx-collector"}');

-- Migration complete
SELECT 'Migration 003_hierarchical_channels completed successfully' AS status;
