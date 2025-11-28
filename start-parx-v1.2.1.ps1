# ParX v1.2.1 - Quick Start Script
# Starts the v1.2.1 frontend with the existing backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting ParX v1.2.1" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if services are already running
$frontendRunning = $false
$backendRunning = $false

try {
    $fe = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    $frontendRunning = $true
    Write-Host "✓ Frontend already running on port 5173" -ForegroundColor Green
} catch {
    Write-Host "⊘ Frontend not running" -ForegroundColor Yellow
}

try {
    $be = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    $backendRunning = $true
    Write-Host "✓ Backend already running on port 3001" -ForegroundColor Green
} catch {
    Write-Host "⊘ Backend not running" -ForegroundColor Yellow
}

Write-Host ""

# Start backend if not running
if (-not $backendRunning) {
    Write-Host "Starting backend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal
    Write-Host "✓ Backend starting..." -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# Start frontend if not running
if (-not $frontendRunning) {
    Write-Host "Starting frontend v1.2.1..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend-v2; npm run dev" -WindowStyle Normal
    Write-Host "✓ Frontend starting..." -ForegroundColor Green
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ParX v1.2.1 is Ready!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Default Login:" -ForegroundColor Yellow
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Open browser
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
