# ParX v1.2.1 - Industrial Analytics Platform

Microservices-based industrial data collection and analytics platform.

## Architecture

ParX v1.2.1 consists of 5 microservices:

- **Admin API** (Port 3000) - Configuration and user management
- **Data Router** (Port 3001) - WebSocket streaming and message bus
- **Collector** (Port 3002) - Industrial protocol engines
- **Storage Engine** (Port 3003) - Multi-backend data persistence
- **Analytics Engine** (Port 3004) - Historical queries and derived signals

## Quick Start

### Prerequisites

- Docker Desktop
- Docker Compose v2.0+
- Node.js 18+ (for local development)
- Python 3.11+ (for analytics engine local development)

### 1. Start Infrastructure

```bash
# Start databases
docker-compose -f docker-compose.v1.2.1.yml up -d postgres timescaledb redis
```

### 2. Run Migrations

```bash
# Run database migrations
docker-compose -f docker-compose.v1.2.1.yml run --rm migration
```

### 3. Start Services

```bash
# Start all services
docker-compose -f docker-compose.v1.2.1.yml up -d
```

### 4. Verify Services

```bash
# Check health of all services
curl http://localhost:3000/health  # Admin API
curl http://localhost:3001/health  # Data Router
curl http://localhost:3002/health  # Collector
curl http://localhost:3003/health  # Storage Engine
curl http://localhost:3004/health  # Analytics Engine
```

## Development Setup

### Install Dependencies

```bash
# Install Node.js service dependencies
cd services/admin-api && npm install
cd ../data-router && npm install
cd ../collector && npm install
cd ../storage-engine && npm install

# Install Python dependencies
cd ../analytics-engine
pip install -r requirements.txt

# Install database migration tools
cd ../../database && npm install
```

### Run Services Locally

Each service can be run independently:

```bash
# Admin API
cd services/admin-api
npm run dev

# Data Router
cd services/data-router
npm run dev

# Collector
cd services/collector
npm run dev

# Storage Engine
cd services/storage-engine
npm run dev

# Analytics Engine
cd services/analytics-engine
uvicorn src.main:app --reload --port 3004
```

## Project Structure

```
parx-v1.2.1/
├── services/
│   ├── admin-api/          # Configuration & user management
│   ├── data-router/        # WebSocket streaming
│   ├── collector/          # Protocol engines
│   ├── storage-engine/     # Data persistence
│   └── analytics-engine/   # Historical queries
├── shared/
│   ├── utils/              # Shared utilities
│   └── types/              # Shared types
├── database/
│   ├── migrations/         # SQL migration scripts
│   └── migrate.js          # Migration runner
├── frontend-v2/            # React frontend (TBD)
├── docs/                   # Documentation
└── docker-compose.v1.2.1.yml
```

## Environment Variables

Each service requires environment variables. See `.env.example` in each service directory.

### Common Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parx
DB_USER=parx
DB_PASSWORD=parx

# TimescaleDB
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5433
TIMESCALE_DB=parx_timeseries
TIMESCALE_USER=parx
TIMESCALE_PASSWORD=parx

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
```

## API Documentation

### Admin API
- Base URL: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/docs` (TBD)

### Data Router
- WebSocket: `ws://localhost:3001`
- Protocol: Socket.IO

### Analytics API
- Base URL: `http://localhost:3004/api/v1`
- Swagger UI: `http://localhost:3004/docs`

See [docs/API-SPEC-v1.2.1.md](docs/API-SPEC-v1.2.1.md) for complete API documentation.

## Database Migrations

Migrations are managed with a custom migration runner:

```bash
# Run all pending migrations
cd database
npm run migrate

# Or using Docker
docker-compose -f docker-compose.v1.2.1.yml run --rm migration
```

## Testing

```bash
# Run tests for a service
cd services/admin-api
npm test

# Run all tests
npm run test:all
```

## Monitoring

### Service Health

All services expose a `/health` endpoint:

```bash
curl http://localhost:3000/health
```

### Logs

Logs are written to `./logs/` directory:

```bash
tail -f logs/admin-api.log
tail -f logs/data-router.log
```

### Docker Logs

```bash
docker-compose -f docker-compose.v1.2.1.yml logs -f admin-api
```

## Troubleshooting

### Services won't start

1. Check if ports are available:
   ```bash
   netstat -an | findstr "3000 3001 3002 3003 3004 5432 5433 6379"
   ```

2. Check Docker logs:
   ```bash
   docker-compose -f docker-compose.v1.2.1.yml logs
   ```

### Database connection errors

1. Verify databases are running:
   ```bash
   docker-compose -f docker-compose.v1.2.1.yml ps
   ```

2. Test database connections:
   ```bash
   docker exec -it parx-postgres psql -U parx -d parx
   docker exec -it parx-timescaledb psql -U parx -d parx_timeseries
   ```

### Migration failures

1. Check migration status:
   ```bash
   docker exec -it parx-postgres psql -U parx -d parx -c "SELECT * FROM schema_migrations;"
   ```

2. Manually run migrations:
   ```bash
   cd database
   npm run migrate
   ```

## Phase 1 Deliverables

✅ Monorepo structure created  
✅ Database schemas designed  
✅ Migration scripts created  
✅ Service skeletons implemented  
✅ Docker Compose configuration  
✅ Shared utilities library  
✅ Health check endpoints  

## Next Steps

- **Phase 2**: Implement Admin API endpoints (authentication, I/O config)
- **Phase 3**: Build protocol engines and data collection
- **Phase 4**: Implement storage backends
- **Phase 5**: Build analytics engine
- **Phase 6-8**: Frontend development

## Documentation

- [PRD](docs/PRD-v1.2.1.md) - Product Requirements
- [Architecture](docs/ARCHITECTURE-v1.2.1.md) - System Architecture
- [API Spec](docs/API-SPEC-v1.2.1.md) - API Documentation
- [Database Schema](docs/DATABASE-SCHEMA-v1.2.1.md) - Database Design
- [Implementation Plan](docs/IMPLEMENTATION-PLAN-v1.2.1.md) - Development Roadmap

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
