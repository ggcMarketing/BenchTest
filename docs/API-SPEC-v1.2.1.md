# ParX v1.2.1 API Specification

## Base URLs

- **Admin API**: `http://localhost:3000/api/v1`
- **Data Router**: `ws://localhost:3001` (WebSocket)
- **Analytics API**: `http://localhost:3004/api/v1`

## Authentication

All API requests (except `/auth/login`) require JWT authentication.

**Header**: `Authorization: Bearer <token>`

**Token Expiry**: 15 minutes (access token), 7 days (refresh token)

---

## Admin API Endpoints

### Authentication

#### POST /auth/login
Login and receive JWT tokens.

**Request**:
```json
{
  "username": "operator1",
  "password": "pass123"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "operator1",
    "role": "operator",
    "name": "Operator One"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### POST /auth/refresh
Refresh access token.

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGc..."
}
```

#### POST /auth/logout
Invalidate refresh token.

---

### I/O Configuration

#### GET /io/channels
List all configured channels.

**Query Parameters**:
- `protocol` (optional): Filter by protocol
- `enabled` (optional): Filter by enabled status

**Response**:
```json
{
  "channels": [
    {
      "id": "ch-001",
      "name": "Line Speed",
      "protocol": "modbus",
      "enabled": true,
      "config": {
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
      "metadata": {
        "units": "m/min",
        "description": "Production line speed",
        "group": "Process"
      },
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /io/channels
Create a new channel.

**Request**:
```json
{
  "name": "Line Speed",
  "protocol": "modbus",
  "enabled": true,
  "config": {
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
  "metadata": {
    "units": "m/min",
    "description": "Production line speed",
    "group": "Process"
  }
}
```

**Response**: Same as GET single channel

#### GET /io/channels/:id
Get channel by ID.

#### PUT /io/channels/:id
Update channel configuration.

#### DELETE /io/channels/:id
Delete channel.

#### POST /io/channels/:id/test
Test channel connection.

**Response**:
```json
{
  "success": true,
  "value": 125.5,
  "quality": "GOOD",
  "timestamp": "2026-01-15T10:00:00Z",
  "latency": 45
}
```

---

### Storage Configuration

#### GET /storage/rules
List all storage rules.

**Response**:
```json
{
  "rules": [
    {
      "id": "rule-001",
      "name": "Continuous Process Data",
      "enabled": true,
      "backend": "timescaledb",
      "mode": "continuous",
      "channels": ["ch-001", "ch-002", "ch-003"],
      "interval": 1000,
      "retention": "7d",
      "createdAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "rule-002",
      "name": "Coil Batch Files",
      "enabled": true,
      "backend": "file",
      "mode": "event",
      "trigger": {
        "type": "signal",
        "channel": "ch-coil-start",
        "condition": "rising_edge"
      },
      "channels": ["ch-001", "ch-002", "ch-003"],
      "fileConfig": {
        "format": "csv",
        "path": "/data/coils",
        "naming": "coil_{timestamp}_{coilId}.csv"
      }
    }
  ]
}
```

#### POST /storage/rules
Create storage rule.

#### PUT /storage/rules/:id
Update storage rule.

#### DELETE /storage/rules/:id
Delete storage rule.

---

### Dashboard Configuration

#### GET /dashboards
List all dashboards.

**Query Parameters**:
- `userId` (optional): Filter by user
- `shared` (optional): Include shared dashboards

**Response**:
```json
{
  "dashboards": [
    {
      "id": "dash-001",
      "name": "Operator View",
      "description": "Main operator dashboard",
      "userId": 1,
      "shared": true,
      "layout": {
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
              "decimals": 1,
              "thresholds": {
                "warning": 100,
                "critical": 150
              }
            }
          },
          {
            "id": "widget-002",
            "type": "trend-graph",
            "position": { "x": 0, "y": 2, "w": 12, "h": 4 },
            "config": {
              "channels": ["ch-001", "ch-002", "ch-003"],
              "timeWindow": 600,
              "autoScale": true
            }
          }
        ]
      },
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /dashboards
Create dashboard.

#### PUT /dashboards/:id
Update dashboard.

#### DELETE /dashboards/:id
Delete dashboard.

#### POST /dashboards/:id/export
Export dashboard as JSON template.

#### POST /dashboards/import
Import dashboard from JSON template.

---

### User Management

#### GET /users
List all users (Admin only).

#### POST /users
Create user (Admin only).

#### PUT /users/:id
Update user.

#### DELETE /users/:id
Delete user (Admin only).

---

## Data Router WebSocket API

### Connection

```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'Bearer eyJhbGc...'
  }
});
```

### Events

#### Client → Server

**subscribe**
Subscribe to channel updates.

```javascript
socket.emit('subscribe', {
  channels: ['ch-001', 'ch-002']
});
```

**unsubscribe**
Unsubscribe from channels.

```javascript
socket.emit('unsubscribe', {
  channels: ['ch-001']
});
```

#### Server → Client

**channelUpdate**
Real-time channel value update.

```javascript
socket.on('channelUpdate', (data) => {
  // data = {
  //   channelId: 'ch-001',
  //   value: 125.5,
  //   quality: 'GOOD',
  //   timestamp: 1705315200000
  // }
});
```

**alarm**
Alarm notification.

```javascript
socket.on('alarm', (data) => {
  // data = {
  //   id: 'alarm-001',
  //   channelId: 'ch-001',
  //   severity: 'WARNING',
  //   message: 'Line speed high: 155.2 m/min',
  //   timestamp: 1705315200000
  // }
});
```

**connectionStatus**
Connection status change.

```javascript
socket.on('connectionStatus', (data) => {
  // data = {
  //   channelId: 'ch-001',
  //   status: 'connected' | 'disconnected' | 'error',
  //   message: 'Connection established'
  // }
});
```

---

## Analytics API Endpoints

### Historical Data

#### POST /analytics/query
Query historical data.

**Request**:
```json
{
  "channels": ["ch-001", "ch-002"],
  "startTime": "2026-01-15T00:00:00Z",
  "endTime": "2026-01-15T08:00:00Z",
  "aggregation": {
    "function": "avg",
    "interval": "1m"
  },
  "limit": 10000
}
```

**Response**:
```json
{
  "data": {
    "ch-001": [
      {
        "timestamp": "2026-01-15T00:00:00Z",
        "value": 125.5,
        "quality": "GOOD"
      }
    ],
    "ch-002": [
      {
        "timestamp": "2026-01-15T00:00:00Z",
        "value": 2.5,
        "quality": "GOOD"
      }
    ]
  },
  "metadata": {
    "totalPoints": 480,
    "queryTime": 245
  }
}
```

---

### Derived Signals

#### POST /analytics/derived/evaluate
Evaluate derived signal formula.

**Request**:
```json
{
  "formula": "avg(ch-001, ch-002) * 1.5",
  "channels": ["ch-001", "ch-002"],
  "startTime": "2026-01-15T00:00:00Z",
  "endTime": "2026-01-15T08:00:00Z"
}
```

**Response**:
```json
{
  "data": [
    {
      "timestamp": "2026-01-15T00:00:00Z",
      "value": 192.0
    }
  ]
}
```

#### POST /analytics/derived/signals
Create derived signal definition.

**Request**:
```json
{
  "name": "Average Speed",
  "formula": "avg(ch-001, ch-002)",
  "units": "m/min",
  "description": "Average of line speeds"
}
```

#### GET /analytics/derived/signals
List derived signals.

#### DELETE /analytics/derived/signals/:id
Delete derived signal.

---

### Batch/Coil Navigation

#### GET /analytics/batches
List batches/coils.

**Query Parameters**:
- `startTime` (optional)
- `endTime` (optional)
- `status` (optional)

**Response**:
```json
{
  "batches": [
    {
      "id": "coil-001",
      "startTime": "2026-01-15T08:00:00Z",
      "endTime": "2026-01-15T10:30:00Z",
      "status": "completed",
      "metadata": {
        "grade": "CR4",
        "targetThickness": 2.5,
        "length": 1250
      }
    }
  ]
}
```

#### GET /analytics/batches/:id
Get batch details.

---

### Export

#### POST /analytics/export
Export data to file.

**Request**:
```json
{
  "channels": ["ch-001", "ch-002"],
  "startTime": "2026-01-15T00:00:00Z",
  "endTime": "2026-01-15T08:00:00Z",
  "format": "csv" | "xlsx" | "json" | "parquet",
  "filename": "export_2026-01-15.csv"
}
```

**Response**:
```json
{
  "downloadUrl": "/downloads/export_2026-01-15.csv",
  "expiresAt": "2026-01-15T12:00:00Z",
  "fileSize": 1024000
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Channel ID is required",
    "details": {
      "field": "channelId"
    }
  }
}
```

### Error Codes

- `INVALID_REQUEST` - Bad request parameters
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., duplicate name)
- `INTERNAL_ERROR` - Server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

---

## Rate Limiting

- **Admin API**: 100 requests/minute per user
- **Analytics API**: 20 requests/minute per user
- **WebSocket**: 1000 messages/minute per connection

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705315260
```

---

## Versioning

API version is included in the URL path: `/api/v1/...`

Breaking changes will increment the major version.
