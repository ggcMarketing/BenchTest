#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start ParX Phase 1 Test Environment
.DESCRIPTION
    This script starts all required services for Phase 1 testing:
    - PostgreSQL and Redis (via Docker)
    - Collector Service
    - Data Router Service
    - Storage Engine Service
    - Frontend Development Server
#>

Write-Host "🚀 Starting ParX Phase 1 Test Environment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running`n" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Start PostgreSQL and Redis
Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker-compose up -d postgres redis

Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if services are ready
$postgresReady = docker-compose ps postgres | Select-String "Up"
$redisReady = docker-compose ps redis | Select-String "Up"

if ($postgresReady -and $redisReady) {
    Write-Host "✓ PostgreSQL and Redis are ready`n" -ForegroundColor Green
} else {
    Write-Host "✗ Services failed to start. Check Docker logs." -ForegroundColor Red
    exit 1
}

# Setup test channels
Write-Host "Setting up test channels..." -ForegroundColor Yellow
node scripts/setup-test-channels.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Test channels created`n" -ForegroundColor Green
} else {
    Write-Host "⚠ Test channels may already exist (this is OK)`n" -ForegroundColor Yellow
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "============`n" -ForegroundColor Cyan

Write-Host "1. Start a Modbus TCP simulator on port 502:" -ForegroundColor White
Write-Host "   Option A: ModbusPal (GUI) - https://sourceforge.net/projects/modbuspal/" -ForegroundColor Gray
Write-Host "   Option B: diagslave - diagslave -m tcp -p 502" -ForegroundColor Gray
Write-Host "   Option C: Python simulator - sudo python modbus_simulator.py`n" -ForegroundColor Gray

Write-Host "2. Open 4 new terminal windows and run:" -ForegroundColor White
Write-Host "   Terminal 1: cd services/collector && npm start" -ForegroundColor Gray
Write-Host "   Terminal 2: cd services/data-router && npm start" -ForegroundColor Gray
Write-Host "   Terminal 3: cd services/storage-engine && npm start" -ForegroundColor Gray
Write-Host "   Terminal 4: cd frontend-v2 && npm run dev`n" -ForegroundColor Gray

Write-Host "3. Open browser to http://localhost:5173`n" -ForegroundColor White

Write-Host "4. Login with:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: admin123`n" -ForegroundColor Gray

Write-Host "5. Go to Dashboard Builder and add widgets`n" -ForegroundColor White

Write-Host "📖 For detailed testing instructions, see:" -ForegroundColor Cyan
Write-Host "   docs/PHASE1-TESTING-GUIDE.md`n" -ForegroundColor Gray

Write-Host "✅ Infrastructure is ready!" -ForegroundColor Green
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
