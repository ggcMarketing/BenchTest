# ParX v1.2.1 - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying ParX v1.2.1 in various environments, from development to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Compose Deployment](#docker-compose-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Production Considerations](#production-considerations)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Backup and Recovery](#backup-and-recovery)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum (Development)**:
- CPU: 4 cores
- RAM: 8 GB
- Disk: 50 GB
- OS: Linux, macOS, or Windows with WSL2

**Recommended (Production)**:
- CPU: 8+ cores
- RAM: 16+ GB
- Disk: 200+ GB SSD
- OS: Linux (Ubuntu 20.04+ or RHEL 8+)

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+ (for Docker deployment)
- Kubernetes 1.24+ (for K8s deployment)
- kubectl (for K8s deployment)
- Helm 3.0+ (optional, for Helm deployment)

## Docker Compose Deployment

### Development Environment

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/parx.git
   cd parx
   git checkout parx-v1.2.1
   ```

2. **Configure environment variables**:
   ```bash
   # Copy example environment files
   cp backend/.env.example backend/.env
   cp frontend-v2/.env.example frontend-v2/.env
   
   # Edit as needed
   nano backend/.env
   ```

3. **Start services**:
   ```bash
   docker-compose -f docker-compose.v1.2.1.yml up -d
   ```

4. **Run database migrations**:
   ```bash
   docker-compose -f docker-compose.v1.2.1.yml exec admin-api node /app/database/migrate.js
   ```

5. **Verify deployment**:
   ```bash
   # Check service health
   curl http://localhost:3000/health
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   curl http://localhost:3003/health
   curl http://localhost:3004/health
   
   # Access frontend
   open http://localhost:5173
   ```

6. **Run tests**:
   ```bash
   pwsh ./test-all.ps1
   ```

### Production Environment (Docker Compose)

1. **Use production compose file**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Configure production settings**:
   - Set strong passwords in `.env` files
   - Configure SSL/TLS certificates
   - Set up reverse proxy (nginx/traefik)
   - Enable authentication
   - Configure backup schedules

3. **Set up monitoring**:
   ```bash
   # Add Prometheus and Grafana
   docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d
   ```

## Kubernetes Deployment

### Prerequisites

1. **Kubernetes cluster** (EKS, GKE, AKS, or self-hosted)
2. **kubectl** configured to access your cluster
3. **Ingress controller** (nginx-ingress recommended)
4. **Cert-manager** (for SSL/TLS certificates)
5. **Storage class** for persistent volumes

### Deployment Steps

1. **Create namespace**:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Create secrets** (DO NOT use the example secrets in production):
   ```bash
   # Create database credentials
   kubectl create secret generic parx-secrets \
     --from-literal=DB_USER=parx \
     --from-literal=DB_PASSWORD=<strong-password> \
     --from-literal=JWT_SECRET=<strong-random-string> \
     --from-literal=JWT_REFRESH_SECRET=<different-strong-random-string> \
     --from-literal=ADMIN_USERNAME=admin \
     --from-literal=ADMIN_PASSWORD=<strong-admin-password> \
     -n parx
   ```

3. **Apply configuration**:
   ```bash
   kubectl apply -f k8s/configmap.yaml
   ```

4. **Deploy infrastructure** (PostgreSQL, Redis):
   ```bash
   kubectl apply -f k8s/postgres-deployment.yaml
   kubectl apply -f k8s/redis-deployment.yaml
   
   # Wait for databases to be ready
   kubectl wait --for=condition=ready pod -l app=postgres -n parx --timeout=300s
   kubectl wait --for=condition=ready pod -l app=redis -n parx --timeout=300s
   ```

5. **Run database migrations**:
   ```bash
   kubectl apply -f k8s/admin-api-deployment.yaml
   
   # Migrations run automatically via init container
   # Check logs
   kubectl logs -l app=admin-api -n parx -c run-migrations
   ```

6. **Deploy services**:
   ```bash
   kubectl apply -f k8s/all-services.yaml
   
   # Wait for all services
   kubectl wait --for=condition=ready pod -l app=data-router -n parx --timeout=300s
   kubectl wait --for=condition=ready pod -l app=collector -n parx --timeout=300s
   kubectl wait --for=condition=ready pod -l app=storage-engine -n parx --timeout=300s
   kubectl wait --for=condition=ready pod -l app=analytics-engine -n parx --timeout=300s
   kubectl wait --for=condition=ready pod -l app=frontend -n parx --timeout=300s
   ```

7. **Configure ingress**:
   ```bash
   # Update ingress.yaml with your domain
   nano k8s/ingress.yaml
   
   # Apply ingress
   kubectl apply -f k8s/ingress.yaml
   ```

8. **Verify deployment**:
   ```bash
   # Check all pods
   kubectl get pods -n parx
   
   # Check services
   kubectl get svc -n parx
   
   # Check ingress
   kubectl get ingress -n parx
   
   # Test health endpoints
   curl https://your-domain.com/api/v1/health
   ```

### Scaling

```bash
# Scale individual services
kubectl scale deployment admin-api --replicas=3 -n parx
kubectl scale deployment data-router --replicas=3 -n parx
kubectl scale deployment collector --replicas=4 -n parx
kubectl scale deployment storage-engine --replicas=3 -n parx
kubectl scale deployment analytics-engine --replicas=3 -n parx

# Auto-scaling (HPA)
kubectl autoscale deployment admin-api --cpu-percent=70 --min=2 --max=10 -n parx
```

## Production Considerations

### Security

1. **Secrets Management**:
   - Use external secrets operator (e.g., AWS Secrets Manager, HashiCorp Vault)
   - Rotate secrets regularly
   - Never commit secrets to git

2. **Network Security**:
   - Use network policies to restrict pod-to-pod communication
   - Enable TLS for all external endpoints
   - Use private subnets for databases

3. **Authentication**:
   - Enforce strong password policies
   - Enable MFA for admin users
   - Implement rate limiting
   - Use OAuth/SAML for enterprise SSO

4. **RBAC**:
   - Implement least-privilege access
   - Regular access audits
   - Separate admin and operator roles

### High Availability

1. **Database**:
   - Use managed database services (RDS, Cloud SQL)
   - Enable automatic backups
   - Configure read replicas
   - Set up failover

2. **Redis**:
   - Use Redis Sentinel or Redis Cluster
   - Enable persistence (AOF + RDB)
   - Configure replication

3. **Services**:
   - Run multiple replicas (minimum 2)
   - Use pod anti-affinity rules
   - Configure pod disruption budgets
   - Implement health checks

### Performance

1. **Resource Limits**:
   ```yaml
   resources:
     requests:
       memory: "512Mi"
       cpu: "500m"
     limits:
       memory: "1Gi"
       cpu: "1000m"
   ```

2. **Database Optimization**:
   - Enable TimescaleDB compression
   - Configure appropriate retention policies
   - Create indexes for frequently queried columns
   - Use connection pooling

3. **Caching**:
   - Configure Redis for session storage
   - Cache frequently accessed data
   - Use CDN for static assets

4. **Load Balancing**:
   - Use ingress controller with load balancing
   - Configure session affinity for WebSocket
   - Implement circuit breakers

## Monitoring and Logging

### Prometheus Metrics

1. **Install Prometheus**:
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
   ```

2. **Configure ServiceMonitors**:
   ```yaml
   apiVersion: monitoring.coreos.com/v1
   kind: ServiceMonitor
   metadata:
     name: parx-services
     namespace: parx
   spec:
     selector:
       matchLabels:
         app: admin-api
     endpoints:
     - port: http
       path: /metrics
   ```

### Grafana Dashboards

1. **Access Grafana**:
   ```bash
   kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
   ```

2. **Import ParX dashboards**:
   - Service health dashboard
   - Performance metrics dashboard
   - Business metrics dashboard

### Logging

1. **ELK Stack** (Elasticsearch, Logstash, Kibana):
   ```bash
   helm repo add elastic https://helm.elastic.co
   helm install elasticsearch elastic/elasticsearch -n logging
   helm install kibana elastic/kibana -n logging
   helm install filebeat elastic/filebeat -n logging
   ```

2. **Loki + Grafana**:
   ```bash
   helm repo add grafana https://grafana.github.io/helm-charts
   helm install loki grafana/loki-stack -n logging
   ```

3. **CloudWatch/Stackdriver** (for cloud deployments)

## Backup and Recovery

### Database Backup

1. **Automated backups**:
   ```bash
   # PostgreSQL backup script
   #!/bin/bash
   BACKUP_DIR="/backups/postgres"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   kubectl exec -n parx postgres-0 -- pg_dump -U parx parx | gzip > $BACKUP_DIR/parx_$DATE.sql.gz
   
   # Retain last 30 days
   find $BACKUP_DIR -name "parx_*.sql.gz" -mtime +30 -delete
   ```

2. **Schedule with CronJob**:
   ```yaml
   apiVersion: batch/v1
   kind: CronJob
   metadata:
     name: postgres-backup
     namespace: parx
   spec:
     schedule: "0 2 * * *"  # Daily at 2 AM
     jobTemplate:
       spec:
         template:
           spec:
             containers:
             - name: backup
               image: postgres:15
               command: ["/bin/sh", "-c"]
               args:
                 - pg_dump -h postgres -U parx parx | gzip > /backup/parx_$(date +%Y%m%d).sql.gz
               volumeMounts:
               - name: backup
                 mountPath: /backup
             volumes:
             - name: backup
               persistentVolumeClaim:
                 claimName: backup-pvc
             restartPolicy: OnFailure
   ```

### Restore Procedure

1. **Restore from backup**:
   ```bash
   # Copy backup to pod
   kubectl cp parx_20231201.sql.gz parx/postgres-0:/tmp/
   
   # Restore database
   kubectl exec -n parx postgres-0 -- psql -U parx -d postgres -c "DROP DATABASE IF EXISTS parx;"
   kubectl exec -n parx postgres-0 -- psql -U parx -d postgres -c "CREATE DATABASE parx;"
   kubectl exec -n parx postgres-0 -- bash -c "gunzip < /tmp/parx_20231201.sql.gz | psql -U parx parx"
   ```

2. **Disaster recovery**:
   - Document recovery procedures
   - Test recovery regularly
   - Maintain off-site backups
   - Define RTO and RPO targets

## Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check pod status
kubectl get pods -n parx

# View pod logs
kubectl logs -f <pod-name> -n parx

# Describe pod for events
kubectl describe pod <pod-name> -n parx

# Check resource constraints
kubectl top pods -n parx
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it <pod-name> -n parx -- psql -h postgres -U parx -d parx

# Check database logs
kubectl logs -f postgres-0 -n parx

# Verify secrets
kubectl get secret parx-secrets -n parx -o yaml
```

#### Performance Issues

```bash
# Check resource usage
kubectl top pods -n parx
kubectl top nodes

# Check database performance
kubectl exec -it postgres-0 -n parx -- psql -U parx -d parx -c "SELECT * FROM pg_stat_activity;"

# Check slow queries
kubectl exec -it postgres-0 -n parx -- psql -U parx -d parx -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

#### WebSocket Connection Issues

```bash
# Check ingress configuration
kubectl describe ingress parx-ingress -n parx

# Test WebSocket connection
wscat -c wss://your-domain.com/ws

# Check data-router logs
kubectl logs -f -l app=data-router -n parx
```

### Health Checks

```bash
# Check all service health
for port in 3000 3001 3002 3003 3004; do
  echo "Checking port $port..."
  curl -f http://localhost:$port/health || echo "FAILED"
done

# Check database
kubectl exec -it postgres-0 -n parx -- pg_isready -U parx

# Check Redis
kubectl exec -it redis-0 -n parx -- redis-cli ping
```

### Logs

```bash
# View logs for all services
kubectl logs -f -l app=admin-api -n parx
kubectl logs -f -l app=data-router -n parx
kubectl logs -f -l app=collector -n parx
kubectl logs -f -l app=storage-engine -n parx
kubectl logs -f -l app=analytics-engine -n parx

# View logs with timestamps
kubectl logs --timestamps -l app=admin-api -n parx

# View previous container logs (after crash)
kubectl logs --previous <pod-name> -n parx
```

## Maintenance

### Updates and Upgrades

1. **Rolling updates**:
   ```bash
   # Update image
   kubectl set image deployment/admin-api admin-api=parx/admin-api:v1.2.2 -n parx
   
   # Monitor rollout
   kubectl rollout status deployment/admin-api -n parx
   
   # Rollback if needed
   kubectl rollout undo deployment/admin-api -n parx
   ```

2. **Database migrations**:
   ```bash
   # Run migrations
   kubectl exec -it <admin-api-pod> -n parx -- node /app/database/migrate.js
   ```

### Monitoring Checklist

- [ ] All pods running and healthy
- [ ] Database backups completing successfully
- [ ] Disk usage below 80%
- [ ] Memory usage within limits
- [ ] No error spikes in logs
- [ ] API response times within SLA
- [ ] WebSocket connections stable
- [ ] Data collection active
- [ ] Storage engine writing data
- [ ] Analytics queries performing well

---

**Version**: 1.2.1  
**Last Updated**: Phase 10  
**Support**: support@parx.example.com
