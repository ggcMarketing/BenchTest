# ParX v1.2.1 Product Requirements Document (PRD)

**Process Automation Recording & Analytics System**  
**Version**: v1.2.1 (2026 Release)  
**Owner**: Point A Industrial Analytics  
**Purpose**: Define modifications and new features required for the next major release of ParX to support improved data collection, visualization, and analytics workflows.

## 1. Executive Summary

ParX v1.2.1 introduces a modular, extensible architecture for real-time industrial data collection and analytics. The purpose of this release is to deliver a unified interface for:

- Configuring inputs/outputs across multiple industrial protocols
- Managing data storage, triggers, archival, and timebase
- Providing user-defined dashboards with modular UI components
- Enabling advanced historical analytics and derived signal computation

This release prepares ParX for productization by improving reliability, configurability, and usability for industrial end-users and systems integrators.

## 2. Goals & Non-Goals

### Goals
- Add a standardized I/O Configuration Module for all communications protocols
- Introduce a Data Storage Configuration Engine with user-defined triggers and storage backends
- Deploy a User-Customizable Dashboard framework that supports live modules
- Build an Analytics Workspace for historical viewing, formula-based derived signals, and session-based exploration
- Support containerized deployment across Docker + Kubernetes (EKS/GKE)
- Move toward a fully database-schema versioned architecture

### Non-Goals
- Not building a full SCADA/HMI replacement
- Not replacing historian systems at scale (e.g., PI)
- Not focused on mobile apps in this release

## 3. System Architecture Requirements

### 3.1 Architecture Overview

ParX v1.2.1 consists of:

1. **Collector Service** (Protocol engines, timebase scheduler, buffering)
2. **Data Router** (protobuf/JSON signals, schema registry)
3. **Storage Engine** (TimescaleDB/InfluxDB adapter and file writer)
4. **Dashboard UI** (React + WebSocket live streaming)
5. **Analytics Engine** (Python/Node expression evaluator + historical query API)
6. **Admin API** (Configuration, persistence, user management)

**Requirement**: All services must run as distinct containers and deploy under a unified Helm chart.

## 4. Functional Requirements

### 4.1 I/O Configuration Module

#### Overview
New UI + backend module for configuring industrial protocol inputs/outputs.

#### Requirements

**Support protocol profiles:**
- EtherNet/IP (Producer/Consumer + Tag polling)
- Modbus TCP (Coils, Registers, Scaling)
- OPC UA (Subscription + Read)
- MQTT (Subscribe/Publish)
- EGD (Producer/Consumer exchange mapping)
- ProfiNET (future placeholder, not implemented in this release)

**UI must provide:**
- Add/edit/delete channel
- Protocol-specific parameters
- Scaling, engineering units, metadata
- Polling interval or subscription mode
- Output channel configuration (write rules)

**Signals must be stored in internal schema registry with:**
- ID, Name, Units, Source, Protocol, Group, Data Type, Range, Timestamp Metadata

#### Acceptance Criteria
- User can configure a new EtherNet/IP tag and see it update live in dashboard within <200 ms
- All I/O configurations stored persistently and reload on service restart
- Errors (bad address, timeout) surface in UI logs

### 4.2 Data Storage Configuration Engine

#### Requirements

**Support storage backends:**
- TimescaleDB (primary)
- InfluxDB (optional)
- File-based storage (CSV, Parquet)

**Storage configuration options:**
- Continuous logging
- Change-based logging
- Event-based logging
- Custom trigger (user formula)

**Batch-based logging tied to events like:**
- Coil Start/Stop
- Shift change
- Manual operator pushbutton

**Configure per-signal:**
- Inclusion/exclusion
- Storage interval override
- Data retention

#### Acceptance Criteria
- User can create a storage rule where a coil start event creates a new CSV file with timestamp naming
- Database logging must support 10,000 points/sec sustained for >10 min
- File writer must rotate based on size or time

### 4.3 Dashboard Builder (User-Defined UI)

#### Requirements

**Drag-and-drop dashboard editor**

**Components included:**
- Value Card
- Trend Graph
- Progress Bar
- Alarm Log
- Text/Markdown Block
- Image Block

**Features:**
- Live updates via WebSocket (50 Hz minimum)
- Save dashboard configuration per user or group
- Export/import dashboard JSON template

#### Acceptance Criteria
- Operator can build dashboard within 2 minutes and see live tag data
- Trend graph must support pan/zoom, multi-series, and real-time roll
- Alarm log must ingest events from system event bus

### 4.4 Analytics Workspace

#### Requirements

**Historical signal viewer with:**
- Multi-tag plotting
- Range selection
- Annotation tools
- Batch navigation or coil navigation

**Derived Signal Builder:**
- Formula editor (e.g., avg(A,B), A*1.23, A.diff(), SMA(A, 10))
- Python expression sandbox (restricted environment)
- Ability to write back derived signals into live dashboards

**Export tools:**
- CSV, XLSX, JSON, Parquet

#### Acceptance Criteria
- User can load a 24-hour dataset in <4 seconds
- User can define a new derived signal in the UI and immediately trend it

## 5. Non-Functional Requirements

### Performance
- Real-time dashboard latency <150 ms end-to-end
- Historical query performance <3 sec for typical 8-hr window
- Storage throughput: 10k samples/sec per collector

### Security
- JWT authentication
- Role-based permissions (Operator, Engineer, Admin)
- Audit logging for writes and configuration changes

### Reliability
- No data loss on temporary network outage (buffer to disk)
- Services must automatically restart and reconnect

### Scalability
- Horizontal scaling via Kubernetes replicas
- Allow multiple collectors feeding a single database instance

### Deployment
Must ship with:
- Docker Compose (local dev)
- Helm Chart for EKS/GKE
- CI/CD via GitHub Actions

## 6. User Stories

### I/O Configuration
- As an automation engineer, I need to configure a Modbus TCP input so I can collect line speed from a drive
- As a controls technician, I need to write a boolean back to a PLC on event triggers

### Storage
- As a process engineer, I need coil-based logging so I can analyze coil histories after production

### Dashboard
- As an operator, I want to monitor key values in real time without navigating multiple screens

### Analytics
- As a quality engineer, I want to compute derived signals like deviation RMS for each coil

## 7. Acceptance Test Plan

1. Configure EtherNet/IP + Modbus + OPC UA inputs
2. Build dashboard with live signals
3. Configure database logging: continuous + coil-based
4. Generate historical dataset and verify analytics plots
5. Create derived signals and re-use them in dashboards
6. Validate deployments via Docker Compose → Helm Chart
7. Run 24-hour endurance test (10k points/sec)

## 8. Open Questions for Implementation

1. Should protocol engines live inside one collector or separate microservices?
2. Should Timebase Scheduler run globally or per-protocol?
3. How should derived signals be persisted—virtual only or physical tables?
4. Should user dashboards support embedded scripts (JS/Python)?
5. What storage backend is default for production deployments?

## 9. Deliverables to Generate

- System architecture diagrams
- Updated container map
- API contract definitions (OpenAPI)
- UI mockups
- Database schema migration scripts
- Helm chart skeleton for ParX v1.2.1
