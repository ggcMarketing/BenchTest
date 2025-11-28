#!/bin/bash

# ParX v1.2.1 - Kubernetes Deployment Script

set -e

echo "========================================="
echo "ParX v1.2.1 - Kubernetes Deployment"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="parx"
TIMEOUT="300s"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✓ kubectl is installed and cluster is accessible${NC}"
echo ""

# Function to wait for deployment
wait_for_deployment() {
    local deployment=$1
    echo -e "${YELLOW}Waiting for $deployment to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=$TIMEOUT deployment/$deployment -n $NAMESPACE
    echo -e "${GREEN}✓ $deployment is ready${NC}"
}

# Function to check pod status
check_pods() {
    echo ""
    echo "Pod Status:"
    kubectl get pods -n $NAMESPACE
    echo ""
}

# Step 1: Create namespace
echo "Step 1: Creating namespace..."
kubectl apply -f k8s/namespace.yaml
echo -e "${GREEN}✓ Namespace created${NC}"
echo ""

# Step 2: Create ConfigMap
echo "Step 2: Creating ConfigMap..."
kubectl apply -f k8s/configmap.yaml
echo -e "${GREEN}✓ ConfigMap created${NC}"
echo ""

# Step 3: Create Secrets
echo "Step 3: Creating Secrets..."
echo -e "${YELLOW}WARNING: Using example secrets. Update k8s/secrets.yaml for production!${NC}"
kubectl apply -f k8s/secrets.yaml
echo -e "${GREEN}✓ Secrets created${NC}"
echo ""

# Step 4: Deploy PostgreSQL
echo "Step 4: Deploying PostgreSQL..."
kubectl apply -f k8s/postgres-deployment.yaml
wait_for_deployment postgres
echo ""

# Step 5: Deploy Redis
echo "Step 5: Deploying Redis..."
kubectl apply -f k8s/redis-deployment.yaml
wait_for_deployment redis
echo ""

# Step 6: Deploy Admin API
echo "Step 6: Deploying Admin API..."
kubectl apply -f k8s/admin-api-deployment.yaml
wait_for_deployment admin-api
echo ""

# Step 7: Deploy all services
echo "Step 7: Deploying all services..."
kubectl apply -f k8s/all-services.yaml

echo "Waiting for services to be ready..."
wait_for_deployment data-router
wait_for_deployment collector
wait_for_deployment storage-engine
wait_for_deployment analytics-engine
wait_for_deployment frontend
echo ""

# Step 8: Deploy Ingress
echo "Step 8: Deploying Ingress..."
echo -e "${YELLOW}NOTE: Update k8s/ingress.yaml with your domain before deploying to production${NC}"
kubectl apply -f k8s/ingress.yaml
echo -e "${GREEN}✓ Ingress created${NC}"
echo ""

# Check final status
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""

check_pods

echo "Services:"
kubectl get svc -n $NAMESPACE
echo ""

echo "Ingress:"
kubectl get ingress -n $NAMESPACE
echo ""

# Health checks
echo "Running health checks..."
echo ""

ADMIN_API_POD=$(kubectl get pod -l app=admin-api -n $NAMESPACE -o jsonpath="{.items[0].metadata.name}")
DATA_ROUTER_POD=$(kubectl get pod -l app=data-router -n $NAMESPACE -o jsonpath="{.items[0].metadata.name}")
COLLECTOR_POD=$(kubectl get pod -l app=collector -n $NAMESPACE -o jsonpath="{.items[0].metadata.name}")
STORAGE_POD=$(kubectl get pod -l app=storage-engine -n $NAMESPACE -o jsonpath="{.items[0].metadata.name}")
ANALYTICS_POD=$(kubectl get pod -l app=analytics-engine -n $NAMESPACE -o jsonpath="{.items[0].metadata.name}")

echo "Admin API Health:"
kubectl exec -n $NAMESPACE $ADMIN_API_POD -- curl -s http://localhost:3000/health | head -n 1
echo ""

echo "Data Router Health:"
kubectl exec -n $NAMESPACE $DATA_ROUTER_POD -- curl -s http://localhost:3001/health | head -n 1
echo ""

echo "Collector Health:"
kubectl exec -n $NAMESPACE $COLLECTOR_POD -- curl -s http://localhost:3002/health | head -n 1
echo ""

echo "Storage Engine Health:"
kubectl exec -n $NAMESPACE $STORAGE_POD -- curl -s http://localhost:3003/health | head -n 1
echo ""

echo "Analytics Engine Health:"
kubectl exec -n $NAMESPACE $ANALYTICS_POD -- curl -s http://localhost:3004/health | head -n 1
echo ""

echo "========================================="
echo -e "${GREEN}ParX v1.2.1 deployed successfully!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Update ingress with your domain: kubectl edit ingress parx-ingress -n parx"
echo "2. Configure SSL/TLS certificates"
echo "3. Update secrets with production values"
echo "4. Set up monitoring and logging"
echo "5. Configure backups"
echo ""
echo "Access the application:"
echo "  kubectl port-forward svc/frontend 8080:80 -n parx"
echo "  Then open: http://localhost:8080"
echo ""
