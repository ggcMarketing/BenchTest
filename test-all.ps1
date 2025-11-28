# ParX v1.2.1 - Master Test Script
# Runs all test suites

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ParX v1.2.1 - Master Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
$testResults = @()

# Function to run test and track results
function Run-Test {
    param(
        [string]$Name,
        [string]$Script
    )
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Running: $Name" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $testStart = Get-Date
    
    try {
        & $Script
        $success = $LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null
    }
    catch {
        Write-Host "Error running test: $_" -ForegroundColor Red
        $success = $false
    }
    
    $testEnd = Get-Date
    $duration = ($testEnd - $testStart).TotalSeconds
    
    $result = @{
        Name = $Name
        Success = $success
        Duration = $duration
    }
    
    return $result
}

Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check if services are running
Write-Host "Verifying services..." -ForegroundColor Gray
$services = @(
    @{ Name = "Admin API"; Port = 3000 },
    @{ Name = "Data Router"; Port = 3001 },
    @{ Name = "Collector"; Port = 3002 },
    @{ Name = "Storage Engine"; Port = 3003 },
    @{ Name = "Analytics Engine"; Port = 3004 }
)

$allRunning = $true
foreach ($service in $services) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$($service.Port)/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.status -eq "ok") {
            Write-Host "✓ $($service.Name) is running" -ForegroundColor Green
        } else {
            Write-Host "✗ $($service.Name) is unhealthy" -ForegroundColor Red
            $allRunning = $false
        }
    }
    catch {
        Write-Host "✗ $($service.Name) is not responding" -ForegroundColor Red
        $allRunning = $false
    }
}

if (-not $allRunning) {
    Write-Host ""
    Write-Host "ERROR: Not all services are running!" -ForegroundColor Red
    Write-Host "Please start services with: docker-compose up -d" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "All services are running. Starting tests..." -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Run Phase Tests
Write-Host "=== PHASE TESTS ===" -ForegroundColor Yellow
Write-Host ""

$testResults += Run-Test -Name "Phase 1: Infrastructure" -Script ".\test-phase1.ps1"
$testResults += Run-Test -Name "Phase 2: Admin API" -Script ".\test-phase2.ps1"
$testResults += Run-Test -Name "Phase 3: Data Collection" -Script ".\test-phase3.ps1"
$testResults += Run-Test -Name "Phase 4: Storage Engine" -Script ".\test-phase4.ps1"
$testResults += Run-Test -Name "Phase 5: Analytics Engine" -Script ".\test-phase5.ps1"
$testResults += Run-Test -Name "Phase 8: Admin UI" -Script ".\test-phase8.ps1"

Write-Host ""
Write-Host "=== INTEGRATION TESTS ===" -ForegroundColor Yellow
Write-Host ""

$testResults += Run-Test -Name "End-to-End Integration" -Script ".\test-integration-e2e.ps1"

Write-Host ""
Write-Host "=== PERFORMANCE TESTS ===" -ForegroundColor Yellow
Write-Host ""

$testResults += Run-Test -Name "Performance Testing" -Script ".\test-performance.ps1"

Write-Host ""
Write-Host "=== SECURITY TESTS ===" -ForegroundColor Yellow
Write-Host ""

$testResults += Run-Test -Name "Security Testing" -Script ".\test-security.ps1"

# Calculate results
$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds
$passed = ($testResults | Where-Object { $_.Success }).Count
$failed = ($testResults | Where-Object { -not $_.Success }).Count
$total = $testResults.Count

# Display summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Total Tests: $total" -ForegroundColor Gray
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "  Duration: $([math]::Round($totalDuration, 2)) seconds" -ForegroundColor Gray
Write-Host ""

Write-Host "Test Results:" -ForegroundColor Yellow
foreach ($result in $testResults) {
    $status = if ($result.Success) { "✓ PASS" } else { "✗ FAIL" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    $duration = [math]::Round($result.Duration, 2)
    Write-Host "  $status - $($result.Name) (${duration}s)" -ForegroundColor $color
}

Write-Host ""

if ($failed -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "ParX v1.2.1 is ready for deployment." -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review failed tests and fix issues before deployment." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
