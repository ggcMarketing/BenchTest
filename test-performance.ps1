# ParX v1.2.1 - Performance Testing
# Tests system performance under load

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ParX v1.2.1 - Performance Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"
$analyticsUrl = "http://localhost:3004/api/v1"
$token = ""

# Function to make API calls
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$BaseUrl = $baseUrl
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
            Uri = "$BaseUrl$Endpoint"
            Headers = $headers
            TimeoutSec = 60
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod @params
        $stopwatch.Stop()
        
        return @{
            Response = $response
            Duration = $stopwatch.ElapsedMilliseconds
        }
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        return $null
    }
}

# Login
Write-Host "Authenticating..." -ForegroundColor Gray
$loginBody = @{
    username = "admin"
    password = "admin123"
}

$loginResponse = Invoke-ApiCall -Method "POST" -Endpoint "/auth/login" -Body $loginBody

if ($loginResponse -and $loginResponse.Response.token) {
    $token = $loginResponse.Response.token
    Write-Host "✓ Authenticated (took $($loginResponse.Duration)ms)" -ForegroundColor Green
} else {
    Write-Host "✗ Authentication failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== TEST 1: API RESPONSE TIMES ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "Test 1.1: Channel List Performance" -ForegroundColor Cyan
$result = Invoke-ApiCall -Method "GET" -Endpoint "/io/channels"
if ($result) {
    $duration = $result.Duration
    $count = $result.Response.channels.Count
    Write-Host "✓ Retrieved $count channels in ${duration}ms" -ForegroundColor Green
    
    if ($duration -lt 100) {
        Write-Host "  Performance: Excellent (<100ms)" -ForegroundColor Green
    } elseif ($duration -lt 500) {
        Write-Host "  Performance: Good (<500ms)" -ForegroundColor Green
    } else {
        Write-Host "  Performance: Needs optimization (>500ms)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Test 1.2: Storage Rules Performance" -ForegroundColor Cyan
$result = Invoke-ApiCall -Method "GET" -Endpoint "/storage/rules"
if ($result) {
    $duration = $result.Duration
    $count = $result.Response.rules.Count
    Write-Host "✓ Retrieved $count rules in ${duration}ms" -ForegroundColor Green
    
    if ($duration -lt 100) {
        Write-Host "  Performance: Excellent (<100ms)" -ForegroundColor Green
    } elseif ($duration -lt 500) {
        Write-Host "  Performance: Good (<500ms)" -ForegroundColor Green
    } else {
        Write-Host "  Performance: Needs optimization (>500ms)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Test 1.3: Dashboard List Performance" -ForegroundColor Cyan
$result = Invoke-ApiCall -Method "GET" -Endpoint "/dashboards"
if ($result) {
    $duration = $result.Duration
    $count = $result.Response.dashboards.Count
    Write-Host "✓ Retrieved $count dashboards in ${duration}ms" -ForegroundColor Green
    
    if ($duration -lt 100) {
        Write-Host "  Performance: Excellent (<100ms)" -ForegroundColor Green
    } elseif ($duration -lt 500) {
        Write-Host "  Performance: Good (<500ms)" -ForegroundColor Green
    } else {
        Write-Host "  Performance: Needs optimization (>500ms)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== TEST 2: HISTORICAL QUERY PERFORMANCE ===" -ForegroundColor Yellow
Write-Host ""

# Get first channel for testing
$channels = Invoke-ApiCall -Method "GET" -Endpoint "/io/channels"
if ($channels -and $channels.Response.channels.Count -gt 0) {
    $testChannel = $channels.Response.channels[0].id
    
    Write-Host "Test 2.1: 1-Hour Query (Raw Data)" -ForegroundColor Cyan
    $queryBody = @{
        channels = @($testChannel)
        startTime = (Get-Date).AddHours(-1).ToString("o")
        endTime = (Get-Date).ToString("o")
        aggregation = "raw"
    }
    
    $result = Invoke-ApiCall -Method "POST" -Endpoint "/analytics/query" -Body $queryBody -BaseUrl $analyticsUrl
    if ($result) {
        $duration = $result.Duration
        $points = if ($result.Response.data) { $result.Response.data.Count } else { 0 }
        Write-Host "✓ Retrieved $points points in ${duration}ms" -ForegroundColor Green
        
        if ($duration -lt 1000) {
            Write-Host "  Performance: Excellent (<1s)" -ForegroundColor Green
        } elseif ($duration -lt 3000) {
            Write-Host "  Performance: Good (<3s)" -ForegroundColor Green
        } else {
            Write-Host "  Performance: Needs optimization (>3s)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Test 2.2: 8-Hour Query (1-Second Aggregation)" -ForegroundColor Cyan
    $queryBody = @{
        channels = @($testChannel)
        startTime = (Get-Date).AddHours(-8).ToString("o")
        endTime = (Get-Date).ToString("o")
        aggregation = "1s"
    }
    
    $result = Invoke-ApiCall -Method "POST" -Endpoint "/analytics/query" -Body $queryBody -BaseUrl $analyticsUrl
    if ($result) {
        $duration = $result.Duration
        $points = if ($result.Response.data) { $result.Response.data.Count } else { 0 }
        Write-Host "✓ Retrieved $points points in ${duration}ms" -ForegroundColor Green
        
        if ($duration -lt 2000) {
            Write-Host "  Performance: Excellent (<2s)" -ForegroundColor Green
        } elseif ($duration -lt 5000) {
            Write-Host "  Performance: Good (<5s)" -ForegroundColor Green
        } else {
            Write-Host "  Performance: Needs optimization (>5s)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Test 2.3: 24-Hour Query (1-Minute Aggregation)" -ForegroundColor Cyan
    $queryBody = @{
        channels = @($testChannel)
        startTime = (Get-Date).AddHours(-24).ToString("o")
        endTime = (Get-Date).ToString("o")
        aggregation = "1m"
    }
    
    $result = Invoke-ApiCall -Method "POST" -Endpoint "/analytics/query" -Body $queryBody -BaseUrl $analyticsUrl
    if ($result) {
        $duration = $result.Duration
        $points = if ($result.Response.data) { $result.Response.data.Count } else { 0 }
        Write-Host "✓ Retrieved $points points in ${duration}ms" -ForegroundColor Green
        
        if ($duration -lt 2000) {
            Write-Host "  Performance: Excellent (<2s)" -ForegroundColor Green
        } elseif ($duration -lt 5000) {
            Write-Host "  Performance: Good (<5s)" -ForegroundColor Green
        } else {
            Write-Host "  Performance: Needs optimization (>5s)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=== TEST 3: CONCURRENT REQUEST PERFORMANCE ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "Test 3.1: 10 Concurrent Channel Requests" -ForegroundColor Cyan
$jobs = @()
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

for ($i = 1; $i -le 10; $i++) {
    $job = Start-Job -ScriptBlock {
        param($url, $token)
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        Invoke-RestMethod -Uri "$url/io/channels" -Method GET -Headers $headers -TimeoutSec 30
    } -ArgumentList $baseUrl, $token
    $jobs += $job
}

$results = $jobs | Wait-Job | Receive-Job
$stopwatch.Stop()

Write-Host "✓ Completed 10 concurrent requests in $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
Write-Host "  Average: $([math]::Round($stopwatch.ElapsedMilliseconds / 10, 2))ms per request" -ForegroundColor Gray

$jobs | Remove-Job

Write-Host ""
Write-Host "=== TEST 4: SERVICE HEALTH & UPTIME ===" -ForegroundColor Yellow
Write-Host ""

$services = @(
    @{ Name = "Admin API"; Port = 3000 },
    @{ Name = "Data Router"; Port = 3001 },
    @{ Name = "Collector"; Port = 3002 },
    @{ Name = "Storage Engine"; Port = 3003 },
    @{ Name = "Analytics Engine"; Port = 3004 }
)

foreach ($service in $services) {
    Write-Host "Test 4.$($services.IndexOf($service) + 1): $($service.Name) Performance" -ForegroundColor Cyan
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $health = Invoke-RestMethod -Uri "http://localhost:$($service.Port)/health" -Method GET -TimeoutSec 5
        $stopwatch.Stop()
        
        if ($health.status -eq "ok") {
            Write-Host "✓ Health check: ${stopwatch.ElapsedMilliseconds}ms" -ForegroundColor Green
            
            if ($health.uptime) {
                $uptime = [math]::Round($health.uptime / 60, 1)
                Write-Host "  Uptime: $uptime minutes" -ForegroundColor Gray
            }
            
            if ($health.memory) {
                $memoryMB = [math]::Round($health.memory / 1024 / 1024, 1)
                Write-Host "  Memory: ${memoryMB} MB" -ForegroundColor Gray
            }
            
            if ($stopwatch.ElapsedMilliseconds -lt 50) {
                Write-Host "  Response: Excellent (<50ms)" -ForegroundColor Green
            } elseif ($stopwatch.ElapsedMilliseconds -lt 200) {
                Write-Host "  Response: Good (<200ms)" -ForegroundColor Green
            } else {
                Write-Host "  Response: Slow (>200ms)" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "✗ Service offline or unhealthy" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=== TEST 5: MEMORY & RESOURCE USAGE ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "Test 5.1: Docker Container Stats" -ForegroundColor Cyan
try {
    $containers = docker ps --format "{{.Names}}" 2>$null
    
    if ($containers) {
        Write-Host "✓ Docker containers running:" -ForegroundColor Green
        foreach ($container in $containers) {
            if ($container -match "parx|admin|router|collector|storage|analytics") {
                $stats = docker stats $container --no-stream --format "{{.MemUsage}}" 2>$null
                if ($stats) {
                    Write-Host "  $container : $stats" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "⚠ Docker not available or no containers running" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠ Could not retrieve Docker stats" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Performance Testing Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Performance Summary:" -ForegroundColor Yellow
Write-Host "  Target: API responses <500ms" -ForegroundColor Gray
Write-Host "  Target: Historical queries <3s (8-hour window)" -ForegroundColor Gray
Write-Host "  Target: Health checks <200ms" -ForegroundColor Gray
Write-Host "  Target: Concurrent requests handled efficiently" -ForegroundColor Gray
Write-Host ""
Write-Host "Recommendations:" -ForegroundColor Yellow
Write-Host "  - Monitor query performance with larger datasets" -ForegroundColor Gray
Write-Host "  - Consider caching for frequently accessed data" -ForegroundColor Gray
Write-Host "  - Implement database indexing for time-series queries" -ForegroundColor Gray
Write-Host "  - Add connection pooling for high concurrency" -ForegroundColor Gray
Write-Host ""
