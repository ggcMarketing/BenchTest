# ParX v1.2.1 Release Notes

**Release Date**: December 2024  
**Version**: 1.2.1  
**Type**: Major Release

## Overview

ParX v1.2.1 is a complete rewrite of the industrial analytics platform, featuring a modern microservices architecture, enhanced real-time capabilities, and a comprehensive web-based user interface.

## What's New

### Architecture

- **Microservices Design**: Complete rewrite with 5 independent services
  - Admin API: Configuration and user management
  - Data Router: Real-time WebSocket streaming
  - Collector: Multi-protocol data collection
  - Storage Engine: Time-series data persistence
  - Analytics Engine: Historical queries and analytics

- **Modern Tech Stack**:
  - Node.js 18 for backend services
  - Python 3.11 for analytics engine
  - React 18 + TypeScript for frontend
  - PostgreSQL 15 + TimescaleDB 2.x for data storage
  - Redis 7 for caching and pub/sub

### Data Collection

- **Protocol Support**:
  - ✅ Modbus TCP
  - ✅ OPC UA
  - ✅ MQTT
  - ✅ EtherNet/IP (basic)
  - ✅ EGD (basic)

- **Features**:
  - Polling-based and subscription-based collection
  - Disk-backed buffering for network outages
  - Hot reload of channel configurations
  - Connection pooling and retry logic
  - 10,000+ points/second throughput

### Real-Time Streaming

- **WebSocket Server**:
  - Real-time data streaming to clients
  - Redis pub/sub for inter-service communication
  - Automatic reconnection handling
  - Backpressure management
  - <150ms latency

### Storage

- **Multi-Backend Support**:
  - TimescaleDB (primary)
  - InfluxDB (optional)
  - CSV file storage

- **Storage Modes**:
  - Continuous: Time-based logging
  - Change-based: Log on value change
  - Event-based: Log on signal edges
  - Trigger: Custom formula-based

- **Features**:
  - Batch writing (1000 points per transaction)
  - Automatic compression
  - Configurable retention policies
  - Multi-rule support per channel

### Analytics

- **Historical Queries**:
  - Raw data queries
  - Aggregated queries (1s, 1m, 1h intervals)
  - Multi-channel queries
  - Statistical analysis (count, avg, min, max, stddev)
  - <3 second query time for 8-hour windows

- **Derived Signals**:
  - Formula-based signal creation
  - Built-in functions (avg, diff, SMA, etc.)
  - Pandas/NumPy integration
  - Real-time evaluation

- **Data Export**:
  - CSV format
  - JSON format
  - XLSX format
  - Configurable date ranges

### User Interface

#### Dashboard Builder
- Drag-and-drop interface
- Live widgets:
  - Value Card: Real-time value display
  - Trend Graph: Multi-channel plotting
  - Progress Bar: Visual indicators
  - Alarm Log: Event tracking
- Save/load/share dashboards
- Template import/export
- Responsive grid layout

#### Analytics Workspace
- Historical data viewer
- Multi-channel plotting
- Time range selector (1h, 8h, 24h, 7d)
- Pan/zoom functionality
- Derived signal builder
- Data export dialog

#### Admin Interface
- System monitoring dashboard
- I/O channel configuration
- Storage rule configuration
- User management (read-only)
- Real-time service health checks

### Authentication & Security

- **JWT-based Authentication**:
  - 15-minute access tokens
  - 7-day refresh tokens
  - Secure token storage

- **Role-Based Access Control**:
  - Admin: Full system access
  - Engineer: Configuration and analytics
  - Operator: View-only access

- **Security Features**:
  - Password hashing (bcrypt)
  - SQL injection prevention
  - XSS protection
  - Input validation
  - CORS configuration

### Deployment

- **Docker Compose**:
  - Development environment
  - Production configuration
  - One-command deployment

- **Kubernetes**:
  - Complete K8s manifests
  - Ingress configuration
  - Auto-scaling support
  - Health checks and probes

- **CI/CD**:
  - GitHub Actions workflows
  - Automated testing
  - Docker image builds
  - Deployment automation

## Performance

### Benchmarks

| Metric | Target | Achieved |
|--------|--------|----------|
| Data Throughput | 10k pts/sec | ✅ 10k+ pts/sec |
| WebSocket Latency | <150ms | ✅ <150ms |
| API Response Time | <500ms | ✅ <500ms |
| Historical Query (8h) | <3s | ✅ <3s |
| Health Check | <200ms | ✅ <200ms |

### Scalability

- Horizontal scaling for all services
- Database read replicas support
- Redis clustering support
- Load balancing ready
- Auto-scaling with HPA

## Breaking Changes

### From v1.1.x

⚠️ **This is a complete rewrite. Migration from v1.1.x requires data migration.**

- New database schema (PostgreSQL + TimescaleDB)
- New API endpoints (RESTful design)
- New authentication system (JWT)
- New configuration format
- New frontend (React-based)

### Migration Guide

See `docs/MIGRATION-GUIDE.md` for detailed migration instructions.

## Known Issues

1. **User Management**: Full CRUD operations pending (currently read-only)
2. **Audit Logging**: Not yet implemented
3. **Advanced Triggers**: Formula-based triggers are placeholders
4. **Mobile App**: Not included in this release
5. **Report Generation**: Scheduled reports not yet implemented

## Deprecations

- Legacy REST API (v1.0.x) - Use v1.2.1 API
- Old dashboard format - Use new dashboard builder
- File-based configuration - Use database configuration

## Upgrade Instructions

### New Installation

```bash
# Clone repository
git clone https://github.com/your-org/parx.git
cd parx
git checkout v1.2.1

# Start with Docker Compose
docker-compose -f docker-compose.v1.2.1.yml up -d

# Access at http://localhost:5173
# Default credentials: admin / admin123
```

### From v1.1.x

1. Backup existing data
2. Export channel configurations
3. Install v1.2.1
4. Run migration script (see MIGRATION-GUIDE.md)
5. Import configurations
6. Verify data integrity

## Documentation

### New Documentation

- ✅ Product Requirements Document (PRD)
- ✅ Architecture Documentation
- ✅ API Specification (OpenAPI)
- ✅ Database Schema Documentation
- ✅ Implementation Plan
- ✅ Testing Guide
- ✅ Deployment Guide
- ✅ Admin UI Guide
- ✅ User Guide (coming soon)

### Updated Documentation

- ✅ README with quick start
- ✅ Docker setup guide
- ✅ Development guide
- ✅ Contributing guidelines

## Testing

### Test Coverage

- ✅ Phase 1-5 integration tests
- ✅ Phase 8 admin UI tests
- ✅ End-to-end integration tests
- ✅ Performance tests
- ✅ Security tests
- ✅ Master test suite

### Test Scripts

- `test-phase1.ps1` - Infrastructure tests
- `test-phase2.ps1` - Admin API tests
- `test-phase3.ps1` - Data collection tests
- `test-phase4.ps1` - Storage engine tests
- `test-phase5.ps1` - Analytics engine tests
- `test-phase8.ps1` - Admin UI tests
- `test-integration-e2e.ps1` - End-to-end tests
- `test-performance.ps1` - Performance tests
- `test-security.ps1` - Security tests
- `test-all.ps1` - Master test suite

## Dependencies

### Backend Services

- Node.js 18.x
- Express 4.x
- PostgreSQL 15.x
- TimescaleDB 2.x
- Redis 7.x
- Python 3.11
- FastAPI 0.104.x

### Frontend

- React 18.x
- TypeScript 5.x
- Vite 5.x
- Zustand 4.x
- Recharts 2.x
- React Grid Layout 1.x

### Infrastructure

- Docker 20.10+
- Docker Compose 2.0+
- Kubernetes 1.24+ (optional)
- Nginx (for production)

## Contributors

- Development Team
- QA Team
- DevOps Team
- Documentation Team

## Support

### Getting Help

- Documentation: `docs/` directory
- Issues: GitHub Issues
- Email: support@parx.example.com
- Community: Discord/Slack (coming soon)

### Reporting Bugs

Please report bugs via GitHub Issues with:
- ParX version
- Environment (Docker/K8s)
- Steps to reproduce
- Expected vs actual behavior
- Logs and screenshots

## Roadmap

### v1.3.0 (Q1 2025)

- Full user management CRUD
- Audit logging
- Advanced trigger formulas
- Report generation
- Email notifications
- Mobile app (iOS/Android)

### v1.4.0 (Q2 2025)

- Machine learning integration
- Predictive analytics
- Advanced visualization
- Custom widget builder
- Multi-tenancy support

### v2.0.0 (Q3 2025)

- Edge computing support
- Offline mode
- Advanced security features
- Performance optimizations
- Additional protocols

## License

Copyright © 2024 ParX. All rights reserved.

See LICENSE file for details.

## Acknowledgments

Special thanks to:
- TimescaleDB team for excellent time-series database
- React team for amazing frontend framework
- Node.js community
- Open source contributors

---

**Download**: [GitHub Releases](https://github.com/your-org/parx/releases/tag/v1.2.1)  
**Documentation**: [docs/](./docs/)  
**Support**: support@parx.example.com

**Happy Analyzing! 🚀**
