# ParX Deployment Guide

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+
- Ports 3001 (backend) and 5173 (dev) or 80 (prod) available

## Docker Deployment Options

### Option 1: Development Mode (Hot Reload)

Start both services with hot-reload enabled:

```bash
docker-compose up -d
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Backend Health: http://localhost:3001/api/health

Stop services:
```bash
docker-compose down
```

### Option 2: Production Mode (Optimized Build)

Build and start production-optimized containers:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Access:
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:3001/api

Stop services:
```bash
docker-compose -f docker-compose.prod.yml down
```

## Manual Deployment (Without Docker)

### Backend

```bash
cd backend
npm install
npm start
```

Runs on http://localhost:3001

### Frontend

```bash
cd frontend
npm install
npm run dev      # Development mode
# OR
npm run build    # Production build
npm run preview  # Preview production build
```

Development: http://localhost:5173

## Environment Configuration

### Backend (.env)

Create `backend/.env` from `backend/.env.example`:

```env
PORT=3001
NODE_ENV=production
```

### Frontend (.env)

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3001
```

For production deployment, update `VITE_API_URL` to your actual backend URL.

## Docker Architecture

### Development Setup
- **Backend**: Node.js 18 Alpine with live code reload
- **Frontend**: Vite dev server with HMR
- **Database**: SQLite with persistent volume
- **Networking**: Services communicate via Docker network

### Production Setup
- **Backend**: Node.js 18 Alpine (production dependencies only)
- **Frontend**: Nginx Alpine serving optimized static build
- **Database**: SQLite with named volume for persistence
- **Health Checks**: Backend health monitoring with automatic restart

## Troubleshooting

### Docker Build Issues

If you encounter build errors:

1. **Clean rebuild**:
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Check logs**:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Verify Docker is running**:
   ```bash
   docker ps
   ```

### Port Conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "3002:3001"  # Change host port
  frontend:
    ports:
      - "5174:5173"  # Change host port
```

### Database Persistence

Data is stored in Docker volumes. To backup:

```bash
docker-compose down
docker run --rm -v benchtest-2_backend-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .
```

To restore:

```bash
docker run --rm -v benchtest-2_backend-data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /data
```

## Default Users

The application comes with pre-configured test users:

| Username   | Password | Role     |
|------------|----------|----------|
| operator1  | pass123  | Operator |
| engineer1  | pass123  | Engineer |
| manager1   | pass123  | Manager  |

**⚠️ Change these credentials in production!**

## Performance Optimization

### Production Build

The production Docker setup includes:
- ✅ Multi-stage builds (smaller images)
- ✅ Nginx with gzip compression
- ✅ Static asset caching
- ✅ Health checks and auto-restart
- ✅ Security headers

### Scaling

To run multiple backend instances:

```bash
docker-compose up -d --scale backend=3
```

Add a load balancer (nginx/traefik) in front for distribution.

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": 1701234567890
}
```

### Container Stats

```bash
docker stats
```

## Security Considerations

1. **Change default passwords** in production
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** with reverse proxy (nginx/traefik)
4. **Restrict CORS** in backend for production domains
5. **Use secrets management** for production deployments

## Cloud Deployment

### AWS ECS / Azure Container Instances / GCP Cloud Run

1. Build and push images:
   ```bash
   docker build -t parx-backend:latest ./backend
   docker build -t parx-frontend:latest -f ./frontend/Dockerfile.prod ./frontend
   ```

2. Tag and push to registry (ECR/ACR/GCR)

3. Deploy using platform-specific tools

### Docker Swarm / Kubernetes

See `k8s/` directory for Kubernetes manifests (if needed).

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify health: `curl http://localhost:3001/api/health`
- Review this guide's troubleshooting section
