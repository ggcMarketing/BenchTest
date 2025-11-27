# ParX v1.2.1 Phase 2 Test Script
# Tests Admin API endpoints

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "ParX v1.2.1 Phase 2 Test" -ForegroundColor Cyan
Write-Host "Admin API & Configuration" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"
$token = ""

# Test 1: Login
Write-Host "Test 1: User Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = "engineer1"
        password = "pass123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $response.accessToken
    Write-Host "✓ Login successful: $($response.user.username) ($($response.user.role))" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Create Channel
Write-Host ""
Write-Host "Test 2: Create I/O Channel..." -ForegroundColor Yellow
try {
    $channelBody = @{
        name = "Test Line Speed"
        protocol = "modbus"
        enabled = $true
        config = @{
            host = "192.168.1.10"
            port = 502
            unitId = 1
            register = 40001
            dataType = "float"
        }
        metadata = @{
            units = "m/min"
            description = "Test channel"
        }
    } | ConvertTo-Json -Depth 10

    $headers = @{
        Authorization = "Bearer $token"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/io/channels" -Method Post -Body $channelBody -ContentType "application/json" -Headers $headers
    $channelId = $response.id
    Write-Host "✓ Channel created: $channelId" -ForegroundColor Green
} catch {
    Write-Host "✗ Channel creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: List Channels
Write-Host ""
Write-Host "Test 3: List Channels..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/io/channels" -Method Get -Headers $headers
    Write-Host "✓ Found $($response.channels.Count) channel(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ List channels failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Create Storage Rule
Write-Host ""
Write-Host "Test 4: Create Storage Rule..." -ForegroundColor Yellow
try {
    $ruleBody = @{
        name = "Test Continuous Logging"
        enabled = $true
        backend = "timescaledb"
        mode = "continuous"
        channels = @($channelId)
        config = @{
            interval = 1000
            retention = "7d"
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "$baseUrl/storage/rules" -Method Post -Body $ruleBody -ContentType "application/json" -Headers $headers
    Write-Host "✓ Storage rule created: $($response.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Storage rule creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Create Dashboard
Write-Host ""
Write-Host "Test 5: Create Dashboard..." -ForegroundColor Yellow
try {
    $dashboardBody = @{
        name = "Test Dashboard"
        description = "Test dashboard for Phase 2"
        shared = $false
        layout = @{
            grid = @{
                cols = 12
                rows = 8
            }
            widgets = @(
                @{
                    id = "widget-001"
                    type = "value-card"
                    position = @{ x = 0; y = 0; w = 3; h = 2 }
                    config = @{
                        channel = $channelId
                        title = "Line Speed"
                    }
                }
            )
        }
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri "$baseUrl/dashboards" -Method Post -Body $dashboardBody -ContentType "application/json" -Headers $headers
    Write-Host "✓ Dashboard created: $($response.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Dashboard creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: List Dashboards
Write-Host ""
Write-Host "Test 6: List Dashboards..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/dashboards" -Method Get -Headers $headers
    Write-Host "✓ Found $($response.dashboards.Count) dashboard(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ List dashboards failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 2 Test Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin API endpoints tested:" -ForegroundColor Cyan
Write-Host "  ✓ Authentication (login)" -ForegroundColor Gray
Write-Host "  ✓ I/O Channels (create, list)" -ForegroundColor Gray
Write-Host "  ✓ Storage Rules (create)" -ForegroundColor Gray
Write-Host "  ✓ Dashboards (create, list)" -ForegroundColor Gray
Write-Host ""
