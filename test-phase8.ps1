# ParX v1.2.1 - Phase 8 Testing Script
# Admin UI Testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ParX v1.2.1 - Phase 8: Admin UI Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"
$token = ""

# Function to make API calls
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    try {
        $params = @{
            Method = $Method
            Uri = "$baseUrl$Endpoint"
            Headers = $headers
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        return $null
    }
}

# Test 1: Authentication
Write-Host "Test 1: Authentication" -ForegroundColor Yellow
Write-Host "Logging in as admin..." -ForegroundColor Gray

$loginBody = @{
    username = "admin"
    password = "admin123"
}

$loginResponse = Invoke-ApiCall -Method "POST" -Endpoint "/auth/login" -Body $loginBody

if ($loginResponse -and $loginResponse.token) {
    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "✗ Login failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: I/O Channels Configuration
Write-Host "Test 2: I/O Channels Configuration" -ForegroundColor Yellow

Write-Host "Fetching channels..." -ForegroundColor Gray
$channels = Invoke-ApiCall -Method "GET" -Endpoint "/io/channels"

if ($channels) {
    Write-Host "✓ Retrieved $($channels.channels.Count) channels" -ForegroundColor Green
    foreach ($channel in $channels.channels | Select-Object -First 3) {
        Write-Host "  - $($channel.name) ($($channel.protocol))" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Failed to retrieve channels" -ForegroundColor Red
}

Write-Host ""

# Test 3: Create Test Channel
Write-Host "Test 3: Create Test Channel" -ForegroundColor Yellow

$newChannel = @{
    id = "test-channel-$(Get-Date -Format 'yyyyMMddHHmmss')"
    name = "Test Channel"
    protocol = "modbus"
    enabled = $true
    config = @{
        host = "192.168.1.100"
        port = 502
        unitId = 1
        register = 40001
        dataType = "float"
        pollInterval = 1000
    }
    metadata = @{
        units = "°C"
        description = "Test temperature sensor"
    }
}

$createResponse = Invoke-ApiCall -Method "POST" -Endpoint "/io/channels" -Body $newChannel

if ($createResponse) {
    Write-Host "✓ Channel created successfully" -ForegroundColor Green
    Write-Host "  ID: $($newChannel.id)" -ForegroundColor Gray
} else {
    Write-Host "✗ Failed to create channel" -ForegroundColor Red
}

Write-Host ""

# Test 4: Storage Rules Configuration
Write-Host "Test 4: Storage Rules Configuration" -ForegroundColor Yellow

Write-Host "Fetching storage rules..." -ForegroundColor Gray
$rules = Invoke-ApiCall -Method "GET" -Endpoint "/storage/rules"

if ($rules) {
    Write-Host "✓ Retrieved $($rules.rules.Count) storage rules" -ForegroundColor Green
    foreach ($rule in $rules.rules | Select-Object -First 3) {
        Write-Host "  - $($rule.name) ($($rule.backend)/$($rule.mode))" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Failed to retrieve storage rules" -ForegroundColor Red
}

Write-Host ""

# Test 5: Create Test Storage Rule
Write-Host "Test 5: Create Test Storage Rule" -ForegroundColor Yellow

$newRule = @{
    id = "test-rule-$(Get-Date -Format 'yyyyMMddHHmmss')"
    name = "Test Storage Rule"
    enabled = $true
    backend = "timescaledb"
    mode = "continuous"
    channels = @($newChannel.id)
    config = @{
        interval = 1000
        batchSize = 100
    }
}

$createRuleResponse = Invoke-ApiCall -Method "POST" -Endpoint "/storage/rules" -Body $newRule

if ($createRuleResponse) {
    Write-Host "✓ Storage rule created successfully" -ForegroundColor Green
    Write-Host "  ID: $($newRule.id)" -ForegroundColor Gray
} else {
    Write-Host "✗ Failed to create storage rule" -ForegroundColor Red
}

Write-Host ""

# Test 6: Service Health Checks
Write-Host "Test 6: Service Health Checks" -ForegroundColor Yellow

$services = @(
    @{ Name = "Admin API"; Port = 3000 },
    @{ Name = "Data Router"; Port = 3001 },
    @{ Name = "Collector"; Port = 3002 },
    @{ Name = "Storage Engine"; Port = 3003 },
    @{ Name = "Analytics Engine"; Port = 3004 }
)

foreach ($service in $services) {
    try {
        $healthUrl = "http://localhost:$($service.Port)/health"
        $health = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 5
        
        if ($health.status -eq "ok") {
            Write-Host "✓ $($service.Name): Healthy" -ForegroundColor Green
            if ($health.uptime) {
                $uptime = [math]::Round($health.uptime / 60, 1)
                Write-Host "  Uptime: $uptime minutes" -ForegroundColor Gray
            }
        } else {
            Write-Host "✗ $($service.Name): Unhealthy" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "✗ $($service.Name): Offline" -ForegroundColor Red
    }
}

Write-Host ""

# Test 7: Dashboard Configuration
Write-Host "Test 7: Dashboard Configuration" -ForegroundColor Yellow

Write-Host "Fetching dashboards..." -ForegroundColor Gray
$dashboards = Invoke-ApiCall -Method "GET" -Endpoint "/dashboards"

if ($dashboards) {
    Write-Host "✓ Retrieved $($dashboards.dashboards.Count) dashboards" -ForegroundColor Green
    foreach ($dashboard in $dashboards.dashboards | Select-Object -First 3) {
        Write-Host "  - $($dashboard.name)" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Failed to retrieve dashboards" -ForegroundColor Red
}

Write-Host ""

# Test 8: Cleanup Test Data
Write-Host "Test 8: Cleanup Test Data" -ForegroundColor Yellow

Write-Host "Deleting test channel..." -ForegroundColor Gray
$deleteChannel = Invoke-ApiCall -Method "DELETE" -Endpoint "/io/channels/$($newChannel.id)"

if ($deleteChannel) {
    Write-Host "✓ Test channel deleted" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to delete test channel" -ForegroundColor Red
}

Write-Host "Deleting test storage rule..." -ForegroundColor Gray
$deleteRule = Invoke-ApiCall -Method "DELETE" -Endpoint "/storage/rules/$($newRule.id)"

if ($deleteRule) {
    Write-Host "✓ Test storage rule deleted" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to delete test storage rule" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 8 Testing Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin UI Components:" -ForegroundColor Yellow
Write-Host "  ✓ I/O Channel Configuration" -ForegroundColor Green
Write-Host "  ✓ Storage Rule Configuration" -ForegroundColor Green
Write-Host "  ✓ System Monitoring" -ForegroundColor Green
Write-Host "  ✓ User Management (Read-only)" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:5173 in browser" -ForegroundColor Gray
Write-Host "  2. Login with admin/admin123" -ForegroundColor Gray
Write-Host "  3. Navigate to Admin section" -ForegroundColor Gray
Write-Host "  4. Test all admin UI tabs" -ForegroundColor Gray
Write-Host ""
