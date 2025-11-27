# ParX v1.2.1 Phase 1 Test Script

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "ParX v1.2.1 Phase 1 Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start databases
Write-Host "Step 1: Starting databases..." -ForegroundColor Yellow
docker-compose -f docker-compose.v1.2.1.yml up -d postgres timescaledb redis

Write-Host "Waiting for databases (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 2: Run migrations
Write-Host ""
Write-Host "Step 2: Running migrations..." -ForegroundColor Yellow
docker-compose -f docker-compose.v1.2.1.yml run --rm migration

# Step 3: Start services
Write-Host ""
Write-Host "Step 3: Starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.v1.2.1.yml up -d admin-api data-router collector storage-engine analytics-engine

Write-Host "Waiting for services (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Test health
Write-Host ""
Write-Host "Step 4: Testing health endpoints..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Testing Admin API (3000)..."
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
    Write-Host "✓ Admin API: $($r.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin API: Failed" -ForegroundColor Red
}

Write-Host "Testing Data Router (3001)..."
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "✓ Data Router: $($r.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Data Router: Failed" -ForegroundColor Red
}

Write-Host "Testing Collector (3002)..."
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3002/health" -TimeoutSec 5
    Write-Host "✓ Collector: $($r.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Collector: Failed" -ForegroundColor Red
}

Write-Host "Testing Storage Engine (3003)..."
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3003/health" -TimeoutSec 5
    Write-Host "✓ Storage Engine: $($r.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Storage Engine: Failed" -ForegroundColor Red
}

Write-Host "Testing Analytics Engine (3004)..."
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3004/health" -TimeoutSec 5
    Write-Host "✓ Analytics Engine: $($r.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Analytics Engine: Failed" -ForegroundColor Red
}

# Show status
Write-Host ""
Write-Host "Container status:" -ForegroundColor Yellow
docker-compose -f docker-compose.v1.2.1.yml ps

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 1 Test Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:  docker-compose -f docker-compose.v1.2.1.yml logs -f" -ForegroundColor Gray
Write-Host "  Stop all:   docker-compose -f docker-compose.v1.2.1.yml down" -ForegroundColor Gray
Write-Host ""
