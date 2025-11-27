/**
 * Shared TypeScript/JavaScript types for ParX v1.2.1
 */

// User roles
export const UserRole = {
  ADMIN: 'admin',
  ENGINEER: 'engineer',
  OPERATOR: 'operator'
};

// Protocol types
export const Protocol = {
  MODBUS: 'modbus',
  ETHERNET_IP: 'ethernet-ip',
  OPCUA: 'opcua',
  MQTT: 'mqtt',
  EGD: 'egd'
};

// Data quality
export const Quality = {
  GOOD: 'GOOD',
  BAD: 'BAD',
  UNCERTAIN: 'UNCERTAIN'
};

// Storage backends
export const StorageBackend = {
  TIMESCALEDB: 'timescaledb',
  INFLUXDB: 'influxdb',
  FILE: 'file'
};

// Storage modes
export const StorageMode = {
  CONTINUOUS: 'continuous',
  CHANGE: 'change',
  EVENT: 'event',
  TRIGGER: 'trigger'
};

// Alarm severity
export const AlarmSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
};

// Widget types
export const WidgetType = {
  VALUE_CARD: 'value-card',
  TREND_GRAPH: 'trend-graph',
  PROGRESS_BAR: 'progress-bar',
  ALARM_LOG: 'alarm-log',
  TEXT_BLOCK: 'text-block',
  IMAGE_BLOCK: 'image-block'
};

// Batch status
export const BatchStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABORTED: 'aborted'
};
