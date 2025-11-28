#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start All ParX Services
.DESCRIPTION
    Starts all ParX microservices in separate terminal windows
#>

Write-Host "🚀 Starting All ParX Services" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

$services = @(
    @{Name="Collector"; Path="services/collector"; Port=3002},
    @{Name="Data Router"; Path="services/data-router"; Port=3001},
    @{Name="Storage Engine"; Path="services/storage-engine"; Port=3003},
    @{Name="Analytics Engine"; Path="services/analytics-engine"; Port=3004},
    @{Name="Admin API"; Path="services/admin-api"; Port=3000},
    @{Name="Frontend"; Path="frontend-v2"; Port=5173}
)

foreach ($service in $services) {
    Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Yellow
    
    if ($service.Name -eq "Analytics Engine") {
        # Python service
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd $($service.Path); python -m uvicorn src.main:app --reload --port $($service.Port)"
    } elseif ($service.Name -eq "Frontend") {
        # Vite dev server
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd $($service.Path); npm run dev"
    } else {
        # Node.js services
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd $($service.Path); npm start"
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n✅ All services started in separate windows!" -ForegroundColor Green
Write-Host "`n📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   Admin API:        http://localhost:3000" -ForegroundColor Gray
Write-Host "   Data Router:      http://localhost:3001" -ForegroundColor Gray
Write-Host "   Collector:        http://localhost:3002" -ForegroundColor Gray
Write-Host "   Storage Engine:   http://localhost:3003" -ForegroundColor Gray
Write-Host "   Analytics Engine: http://localhost:3004" -ForegroundColor Gray
Write-Host "   Frontend:         http://localhost:5173" -ForegroundColor Gray

Write-Host "`n⚠️  Note: Close all terminal windows to stop services" -ForegroundColor Yellow
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
