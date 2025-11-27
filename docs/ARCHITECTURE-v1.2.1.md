# ParX v1.2.1 System Architecture

## Architecture Overview

ParX v1.2.1 is a microservices-based industrial data collection and analytics platform designed for containerized deployment.

## System Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ParX v1.2.1 Architecture                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                            Frontend Layer                                 │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Dashboard UI  │  │  Analytics UI   │  │   Admin UI      │         │
│  │   (React)       │  │   (React)       │  │   (React)       │         │
│  │   - Live View   │  │   - Historical  │  │   - I/O Config  │         │
│  │   - Widgets     │  │   - Derived     │  │   - Storage     │         │
│  │   - Drag/Drop   │  │   - Export      │  │   - Users       │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                     │                   │
│           └────────────────────┴─────────────────────┘                   │
│                                │                                          │
└────────────────────────────────┼──────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   API Gateway / Nginx   │
                    │   - Routing             │
                    │   - Load Balancing      │
                    │   - SSL Termination     │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────┼──────────────────────────────────────────┐
│                         Backend Services Layer                            │
├────────────────────────────────┼──────────────────────────────────────────┤
│                                │                                           │
│  ┌─────────────────────────────▼──────────────────────────────┐          │
│  │                      Admin API Service                      │          │
│  │  - User Management                                          │          │
│  │  - I/O Configuration CRUD                                   │          │
│  │  - Storage Configuration                                    │          │
│  │  - Dashboard Templates                                      │          │
│  │  - JWT Authentication                                       │          │
│  └─────────────────────────────┬──────────────────────────────┘          │
│                                 │                                          │
│  ┌──────────────────────────────┼──────────────────────────────┐         │
│  │                      Data Router Service                     │         │
│  │  - Signal Registry (Schema)                                 │         │
│  │  - Message Bus (Redis/NATS)                                 │         │
│  │  - WebSocket Server (Live Streaming)                        │         │
│  │  - Protobuf/JSON Serialization                              │         │
│  └──────────────────────────────┬──────────────────────────────┘         │
│                                  │                                         │
│  ┌──────────────────────────────┼──────────────────────────────┐         │
│  │                   Collector Service(s)                       │         │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │         │
│  │  │ EtherNet/IP  │  │  Modbus TCP  │  │   OPC UA     │      │         │
│  │  │   Engine     │  │    Engine    │  │   Engine     │      │         │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │         │
│  │  ┌──────────────┐  ┌──────────────┐                        │         │
│  │  │     MQTT     │  │     EGD      │                        │         │
│  │  │   Engine     │  │   Engine     │                        │         │
│  │  └──────────────┘  └──────────────┘                        │         │
│  │  - Timebase Scheduler                                       │         │
│  │  - Buffer Manager (disk-backed)                             │         │
│  │  - Connection Pool                                          │         │
│  └──────────────────────────────┬──────────────────────────────┘         │
│                                  │                                         │
│  ┌──────────────────────────────┼──────────────────────────────┐         │
│  │                    Storage Engine Service                    │         │
│  │  - TimescaleDB Adapter                                       │         │
│  │  - InfluxDB Adapter                                          │         │
│  │  - File Writer (CSV/Parquet)                                 │         │
│  │  - Trigger Engine                                            │         │
│  │  - Batch Manager                                             │         │
│  └──────────────────────────────┬──────────────────────────────┘         │
│                                  │                                         │
│  ┌──────────────────────────────┼──────────────────────────────┐         │
│  │                   Analytics Engine Service                   │         │
│  │  - Historical Query API                                      │         │
│  │  - Derived Signal Evaluator (Python sandbox)                │         │
│  │  - Formula Parser                                            │         │
│  │  - Export Service (CSV/XLSX/JSON/Parquet)                   │         │
│  └──────────────────────────────┬──────────────────────────────┘         │
│                                  │                                         │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────────┐
│                          Data Storage Layer                              │
├──────────────────────────────────┼──────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │  PostgreSQL    │  │  TimescaleDB   │  │   InfluxDB     │            │
│  │  (Config/Users)│  │  (Time-series) │  │  (Time-series) │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│  ┌────────────────┐  ┌────────────────┐                                 │
│  │     Redis      │  │  File Storage  │                                 │
│  │  (Cache/Queue) │  │  (CSV/Parquet) │                                 │
│  └────────────────┘  └────────────────┘                                 │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                        Industrial Equipment Layer                         │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │    PLCs    │  │   Drives   │  │  Sensors   │  │   MQTT     │        │
│  │ (EIP/Modbus│  │  (Modbus)  │  │  (OPC UA)  │  │  Brokers   │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

## Service Descriptions

### 1. Admin API Service
**Technology**: Node.js/Express or Python/FastAPI  
**Port**: 3000  
**Responsibilities**:
- User authentication (JWT)
- I/O configuration management
- Storage rule configuration
- Dashboard template CRUD
- Role-based access control

**Database**: PostgreSQL

### 2. Data Router Service
**Technology**: Node.js/Socket.io or Go  
**Port**: 3001  
**Responsibilities**:
- Central message bus for all signals
- WebSocket server for live streaming
- Signal schema registry
- Protocol buffer serialization
- Rate limiting and backpressure

**Database**: Redis (cache/pub-sub)

### 3. Collector Service
**Technology**: Node.js or Python  
**Port**: 3002  
**Responsibilities**:
- Protocol-specific communication engines
- Timebase scheduler (configurable rates)
- Connection management and retry logic
- Local buffering (disk-backed queue)
- Health monitoring

**Protocols**:
- EtherNet/IP (node-ethernet-ip)
- Modbus TCP (modbus-serial)
- OPC UA (node-opcua)
- MQTT (mqtt.js)
- EGD (custom implementation)

### 4. Storage Engine Service
**Technology**: Node.js or Python  
**Port**: 3003  
**Responsibilities**:
- Write to TimescaleDB/InfluxDB
- File-based storage (CSV/Parquet)
- Trigger evaluation
- Batch/event-based logging
- Data retention policies

**Storage Backends**:
- TimescaleDB (primary)
- InfluxDB (optional)
- File system (CSV/Parquet)

### 5. Analytics Engine Service
**Technology**: Python/FastAPI  
**Port**: 3004  
**Responsibilities**:
- Historical data queries
- Derived signal computation
- Formula parsing and evaluation
- Python expression sandbox
- Export generation

**Libraries**:
- pandas, numpy (data processing)
- pyarrow (Parquet)
- openpyxl (Excel export)

### 6. Frontend Applications
**Technology**: React 18 + TypeScript + Vite  
**Port**: 5173 (dev), 80 (prod)  
**Applications**:
- Dashboard Builder UI
- Analytics Workspace UI
- Admin Configuration UI

## Data Flow

### Real-Time Data Flow
```
PLC/Device → Collector → Data Router → WebSocket → Dashboard UI
                    ↓
              Storage Engine → TimescaleDB
```

### Historical Query Flow
```
Dashboard UI → Analytics Engine → TimescaleDB → Analytics Engine → Dashboard UI
```

### Configuration Flow
```
Admin UI → Admin API → PostgreSQL
                  ↓
            Collector (reload config)
```

## Deployment Architecture

### Docker Compose (Development)
```yaml
services:
  - admin-api
  - data-router
  - collector
  - storage-engine
  - analytics-engine
  - frontend
  - postgres
  - timescaledb
  - redis
```

### Kubernetes (Production)
```
Namespaces:
  - parx-system (core services)
  - parx-collectors (scalable collectors)
  - parx-storage (databases)

Deployments:
  - admin-api (replicas: 2)
  - data-router (replicas: 3)
  - collector (replicas: 1-N, per protocol)
  - storage-engine (replicas: 2)
  - analytics-engine (replicas: 2)
  - frontend (replicas: 2)

StatefulSets:
  - postgres
  - timescaledb
  - redis
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ / Python 3.11+
- **Frameworks**: Express, FastAPI
- **Protocols**: node-ethernet-ip, modbus-serial, node-opcua, mqtt.js
- **Message Queue**: Redis, NATS (optional)
- **WebSocket**: Socket.io

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Charts**: ECharts, Recharts
- **UI Components**: Custom + shadcn/ui

### Databases
- **Configuration**: PostgreSQL 15
- **Time-Series**: TimescaleDB 2.x (PostgreSQL extension)
- **Time-Series (Alt)**: InfluxDB 2.x
- **Cache**: Redis 7

### DevOps
- **Containers**: Docker
- **Orchestration**: Kubernetes (EKS/GKE)
- **CI/CD**: GitHub Actions
- **IaC**: Helm Charts
- **Monitoring**: Prometheus + Grafana

## Security Architecture

### Authentication
- JWT tokens (access + refresh)
- Token expiry: 15 min (access), 7 days (refresh)
- Secure HTTP-only cookies

### Authorization
- Role-based access control (RBAC)
- Roles: Admin, Engineer, Operator
- Permission matrix per endpoint

### Network Security
- TLS/SSL for all external communication
- Internal service mesh (optional: Istio)
- Network policies in Kubernetes

### Data Security
- Encryption at rest (database level)
- Encryption in transit (TLS)
- Audit logging for all writes

## Scalability Considerations

### Horizontal Scaling
- **Data Router**: Scale to handle WebSocket connections
- **Collectors**: Scale per protocol or per device group
- **Analytics Engine**: Scale for concurrent queries
- **Storage Engine**: Scale for write throughput

### Vertical Scaling
- **TimescaleDB**: Increase resources for query performance
- **Redis**: Increase memory for larger signal registry

### Performance Targets
- **Real-time latency**: <150 ms (device → UI)
- **Historical query**: <3 sec (8-hour window)
- **Write throughput**: 10,000 points/sec per collector
- **Concurrent users**: 100+ simultaneous dashboard viewers

## Monitoring & Observability

### Metrics
- Service health endpoints
- Prometheus metrics export
- Custom metrics: signal count, write rate, query latency

### Logging
- Structured JSON logging
- Centralized log aggregation (ELK/Loki)
- Log levels: DEBUG, INFO, WARN, ERROR

### Tracing
- Distributed tracing (Jaeger/Zipkin)
- Request correlation IDs

## Disaster Recovery

### Backup Strategy
- PostgreSQL: Daily full backup + WAL archiving
- TimescaleDB: Continuous backup + point-in-time recovery
- Configuration: Git-based version control

### High Availability
- Multi-replica deployments
- Database replication
- Automatic failover

## Migration Path from v1.0

1. **Database Migration**: Schema versioning with migration scripts
2. **Configuration Import**: Tool to import existing mock data configs
3. **Dashboard Migration**: Convert existing dashboards to new format
4. **Zero-Downtime Deployment**: Blue-green deployment strategy
