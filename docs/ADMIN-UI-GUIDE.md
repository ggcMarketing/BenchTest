# ParX v1.2.1 - Admin UI User Guide

## Overview

The Admin UI provides a comprehensive interface for configuring and monitoring the ParX industrial analytics platform. Access is restricted to users with Admin or Engineer roles.

## Accessing the Admin Interface

1. Navigate to `http://localhost:5173`
2. Login with credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click on the **Admin** link in the navigation

## Admin Sections

### 1. System Monitoring

**Purpose**: Real-time monitoring of all ParX services and infrastructure

**Features**:
- Service health status (Healthy/Unhealthy)
- Uptime tracking for each service
- Memory usage monitoring
- Active connection counts
- Infrastructure status (PostgreSQL, Redis, WebSocket)
- Auto-refresh every 10 seconds
- Manual refresh button

**Services Monitored**:
- Admin API (Port 3000)
- Data Router (Port 3001)
- Collector (Port 3002)
- Storage Engine (Port 3003)
- Analytics Engine (Port 3004)

**Status Indicators**:
- 🟢 Green: Service is healthy and operational
- 🔴 Red: Service is offline or unhealthy
- ⚪ Gray: Status unknown

### 2. I/O Channels

**Purpose**: Configure data collection channels for industrial protocols

**Features**:
- View all configured channels
- Create new channels
- Edit existing channels
- Delete channels
- Enable/disable channels
- Test channel connections

**Supported Protocols**:
- **Modbus TCP**: Industrial automation protocol
- **OPC UA**: Open Platform Communications Unified Architecture
- **MQTT**: Message Queuing Telemetry Transport
- **EtherNet/IP**: Industrial Ethernet protocol
- **EGD**: Ethernet Global Data

**Channel Configuration**:
```json
{
  "id": "temp-sensor-01",
  "name": "Temperature Sensor 1",
  "protocol": "modbus",
  "enabled": true,
  "config": {
    "host": "192.168.1.100",
    "port": 502,
    "unitId": 1,
    "register": 40001,
    "dataType": "float",
    "pollInterval": 1000
  },
  "metadata": {
    "units": "°C",
    "description": "Reactor temperature"
  }
}
```

**How to Create a Channel**:
1. Click **New Channel** button
2. Enter Channel ID (unique identifier)
3. Enter Channel Name (display name)
4. Select Protocol from dropdown
5. Set Status (Enabled/Disabled)
6. Configure protocol-specific settings in JSON
7. Add metadata (units, description, etc.)
8. Click **Save**

### 3. Storage Rules

**Purpose**: Configure how and where data is stored

**Features**:
- View all storage rules
- Create new rules
- Edit existing rules
- Delete rules
- Enable/disable rules
- Assign channels to rules

**Storage Backends**:
- **TimescaleDB**: PostgreSQL-based time-series database
- **InfluxDB**: Purpose-built time-series database
- **File**: CSV file storage with rotation

**Storage Modes**:
- **Continuous**: Time-based logging at fixed intervals
- **Change-based**: Log when value changes exceed deadband
- **Event-based**: Log on signal edge detection
- **Trigger**: Custom formula-based triggers

**Rule Configuration**:
```json
{
  "id": "continuous-logging",
  "name": "Continuous Data Logging",
  "enabled": true,
  "backend": "timescaledb",
  "mode": "continuous",
  "channels": ["temp-sensor-01", "pressure-sensor-01"],
  "config": {
    "interval": 1000,
    "batchSize": 100,
    "retention": "30d"
  }
}
```

**How to Create a Storage Rule**:
1. Click **New Rule** button
2. Enter Rule ID (unique identifier)
3. Enter Rule Name (display name)
4. Select Backend (TimescaleDB, InfluxDB, File)
5. Select Mode (Continuous, Change-based, Event-based, Trigger)
6. Enter Channel IDs (comma-separated)
7. Set Status (Enabled/Disabled)
8. Configure backend-specific settings in JSON
9. Click **Save**

### 4. User Management

**Purpose**: View and manage system users (read-only in current version)

**Features**:
- View all users
- Display user roles
- Show user status (Active/Disabled)
- Role-based icons

**User Roles**:
- 🛡️ **Admin**: Full system access, configuration, and user management
- 💼 **Engineer**: Configuration access, dashboard creation, analytics
- 👤 **Operator**: View-only access to dashboards and data

**Current Limitations**:
- Read-only view (no create/edit/delete)
- Full CRUD operations coming in future update

## Common Tasks

### Adding a New Modbus Channel

1. Go to **I/O Channels** tab
2. Click **New Channel**
3. Configure:
   ```
   Channel ID: modbus-temp-01
   Name: Modbus Temperature Sensor
   Protocol: modbus
   Status: Enabled
   ```
4. Configuration JSON:
   ```json
   {
     "host": "192.168.1.100",
     "port": 502,
     "unitId": 1,
     "register": 40001,
     "dataType": "float",
     "pollInterval": 1000
   }
   ```
5. Metadata JSON:
   ```json
   {
     "units": "°C",
     "description": "Reactor temperature sensor",
     "location": "Reactor 1"
   }
   ```
6. Click **Save**

### Setting Up Continuous Logging

1. Go to **Storage Rules** tab
2. Click **New Rule**
3. Configure:
   ```
   Rule ID: continuous-1s
   Name: 1-Second Continuous Logging
   Backend: timescaledb
   Mode: continuous
   Channels: modbus-temp-01, modbus-pressure-01
   Status: Enabled
   ```
4. Configuration JSON:
   ```json
   {
     "interval": 1000,
     "batchSize": 100,
     "retention": "30d",
     "compression": true
   }
   ```
5. Click **Save**

### Monitoring System Health

1. Go to **System Monitoring** tab
2. View overall system status at the top
3. Check individual service cards for:
   - Status (Online/Offline)
   - Uptime
   - Memory usage
   - Active connections
4. Check infrastructure status (PostgreSQL, Redis, WebSocket)
5. Click **Refresh Status** to manually update

## Troubleshooting

### Service Shows as Unhealthy

**Possible Causes**:
- Service is not running
- Network connectivity issues
- Service crashed or restarted
- Port conflicts

**Solutions**:
1. Check Docker containers: `docker-compose ps`
2. View service logs: `docker-compose logs [service-name]`
3. Restart service: `docker-compose restart [service-name]`
4. Check service health endpoint directly in browser

### Cannot Create Channel

**Possible Causes**:
- Duplicate channel ID
- Invalid JSON configuration
- Missing required fields
- Authentication token expired

**Solutions**:
1. Ensure channel ID is unique
2. Validate JSON syntax
3. Check all required fields are filled
4. Refresh page and login again if needed

### Cannot Save Storage Rule

**Possible Causes**:
- Duplicate rule ID
- Invalid channel references
- Invalid JSON configuration
- Backend not available

**Solutions**:
1. Ensure rule ID is unique
2. Verify channel IDs exist
3. Validate JSON syntax
4. Check backend service is running

## Best Practices

### Channel Configuration

1. **Use descriptive IDs**: `reactor-1-temp` instead of `ch001`
2. **Add metadata**: Include units, location, description
3. **Set appropriate poll intervals**: Balance data resolution vs. network load
4. **Test connections**: Use connection test feature before enabling
5. **Document configurations**: Add descriptions in metadata

### Storage Rules

1. **Match storage mode to use case**:
   - Continuous: Regular monitoring
   - Change-based: Slow-changing values
   - Event-based: Alarms and events
   - Trigger: Complex conditions
2. **Set appropriate retention**: Balance storage cost vs. data needs
3. **Use batch writing**: Improves performance for high-frequency data
4. **Monitor storage usage**: Check database size regularly
5. **Enable compression**: Reduces storage requirements

### System Monitoring

1. **Check regularly**: Monitor system health daily
2. **Set up alerts**: Configure notifications for service failures
3. **Track trends**: Monitor memory usage over time
4. **Plan capacity**: Scale before reaching limits
5. **Document incidents**: Keep log of issues and resolutions

## Keyboard Shortcuts

- `Ctrl + S`: Save current form (when in edit mode)
- `Esc`: Close modal dialog
- `Tab`: Navigate between form fields

## API Reference

All admin operations use the Admin API at `http://localhost:3000/api/v1`

**Authentication Required**: All endpoints require JWT token in Authorization header

### Channels
- `GET /io/channels` - List all channels
- `POST /io/channels` - Create channel
- `PUT /io/channels/:id` - Update channel
- `DELETE /io/channels/:id` - Delete channel
- `POST /io/channels/:id/test` - Test connection

### Storage Rules
- `GET /storage/rules` - List all rules
- `POST /storage/rules` - Create rule
- `PUT /storage/rules/:id` - Update rule
- `DELETE /storage/rules/:id` - Delete rule

### Health Checks
- `GET /health` - Service health status (no auth required)

## Support

For issues or questions:
- Check service logs: `docker-compose logs [service-name]`
- Review API documentation: `docs/API-SPEC-v1.2.1.md`
- Check system architecture: `docs/ARCHITECTURE-v1.2.1.md`
- Run test scripts: `.\test-phase8.ps1`

---

**Version**: 1.2.1  
**Last Updated**: Phase 8 Complete  
**Access Level**: Admin, Engineer
