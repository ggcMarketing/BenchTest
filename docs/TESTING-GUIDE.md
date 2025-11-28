# ParX v1.2.1 - Testing Guide

## Overview

This document provides comprehensive testing procedures for ParX v1.2.1, covering integration testing, performance testing, and security testing.

## Prerequisites

### System Requirements
- Docker and Docker Compose installed
- PowerShell 5.1 or higher
- All services running via `docker-compose up`
- Network access to localhost ports 3000-3004, 5173

### Test Data
- Default admin user: `admin` / `admin123`
- Sample channels and storage rules configured
- Historical data available (run system for 10+ minutes)

## Test Scripts

### 1. Phase-Specific Tests

Each phase has its own test script for targeted validation:

```powershell
# Phase 1: Infrastructure
.\test-phase1.ps1

# Phase 2: Admin API
.\test-phase2.ps1

# Phase 3: Data Collection & Routing
.\test-phase3.ps1

# Phase 4: Storage Engine
.\test-phase4.ps1

# Phase 5: Analytics Engine
.\test-phase5.ps1

# Phase 8: Admin UI
.\test-phase8.ps1
```

### 2. Integration Testing

**Script**: `test-integration-e2e.ps1`

**Purpose**: Validates complete data flow from configuration to visualization

**Test Phases**:
1. Authentication - User login and token management
2. Configuration - Create channels and storage rules
3. Data Collection - Verify collector picks up configuration
4. Data Routing - Verify WebSocket streaming
5. Data Storage - Verify data persistence
6. Analytics - Query historical data
7. Dashboard - Create and retrieve dashboards
8. Cleanup - Remove test data

**Usage**:
```powershell
.\test-integration-e2e.ps1
```

**Expected Duration**: 30-60 seconds

**Success Criteria**:
- All 8 phases complete successfully
- Data flows from channel config to analytics
- No errors in service logs
- Test data cleaned up properly

### 3. Performance Testing

**Script**: `test-performance.ps1`

**Purpose**: Validates system performance under various loads

**Test Categories**:
1. **API Response Times**
   - Channel list retrieval
   - Storage rules retrieval
   - Dashboard list retrieval
   - Target: <500ms

2. **Historical Query Performance**
   - 1-hour raw data query
   - 8-hour aggregated query (1s intervals)
   - 24-hour aggregated query (1m intervals)
   - Target: <3s for 8-hour window

3. **Concurrent Request Performance**
   - 10 simultaneous API requests
   - Measures total time and average per request
   - Target: Efficient handling without degradation

4. **Service Health & Uptime**
   - Health check response times
   - Memory usage monitoring
   - Uptime tracking
   - Target: <200ms health checks

5. **Resource Usage**
   - Docker container memory usage
   - CPU utilization
   - Network throughput

**Usage**:
```powershell
.\test-performance.ps1
```

**Expected Duration**: 2-3 minutes

**Performance Targets**:
- API responses: <500ms
- Historical queries: <3s (8-hour window)
- Health checks: <200ms
- Concurrent requests: No significant degradation

### 4. Security Testing

**Script**: `test-security.ps1`

**Purpose**: Validates authentication, authorization, and security controls

**Test Categories**:
1. **Authentication**
   - Valid login acceptance
   - Invalid password rejection
   - Non-existent user rejection
   - Empty credentials rejection
   - SQL injection prevention

2. **Authorization**
   - Access without token blocked
   - Invalid token rejection
   - Valid token acceptance
   - Token expiration (manual test)

3. **Input Validation**
   - XSS attempt handling
   - Invalid JSON rejection
   - Missing required fields rejection
   - Extremely long input handling

4. **API Security**
   - CORS headers verification
   - Rate limiting (manual test)
   - HTTPS enforcement (production)

5. **Data Protection**
   - Password hashing (bcrypt)
   - Token security (JWT)
   - Sensitive data in logs

6. **Protocol Security**
   - WebSocket authentication
   - Database connection security

**Usage**:
```powershell
.\test-security.ps1
```

**Expected Duration**: 1-2 minutes

**Security Requirements**:
- All authentication tests pass
- Authorization properly enforced
- Input validation prevents injection attacks
- Sensitive data properly protected

## Manual Testing Procedures

### Frontend Testing

#### 1. Login Flow
1. Navigate to `http://localhost:5173`
2. Enter credentials: `admin` / `admin123`
3. Verify successful login and redirect to dashboard
4. Check token storage in browser (DevTools > Application > Local Storage)

#### 2. Dashboard Functionality
1. View existing dashboards
2. Create new dashboard
3. Add widgets (Value Card, Trend Graph, Progress Bar, Alarm Log)
4. Drag and resize widgets
5. Save dashboard
6. Verify live data updates
7. Export dashboard
8. Delete dashboard

#### 3. Analytics Workspace
1. Navigate to Analytics page
2. Select channel(s) for historical view
3. Choose time range (1h, 8h, 24h, 7d)
4. Verify chart displays correctly
5. Test pan/zoom functionality
6. Create derived signal
7. Export data (CSV, JSON, XLSX)

#### 4. Admin Interface
1. Navigate to Admin page
2. **System Monitoring Tab**:
   - Verify all services show as healthy
   - Check uptime and memory usage
   - Test manual refresh
3. **I/O Channels Tab**:
   - Create new channel
   - Edit existing channel
   - Delete channel
   - Verify JSON configuration
4. **Storage Rules Tab**:
   - Create new rule
   - Edit existing rule
   - Delete rule
   - Assign channels to rule
5. **User Management Tab**:
   - View user list
   - Verify role display

### Protocol Testing

#### Modbus TCP
1. Configure Modbus channel in Admin UI
2. Point to Modbus simulator or real device
3. Verify data collection in logs
4. Check data appears in dashboard

#### OPC UA
1. Configure OPC UA channel
2. Connect to OPC UA server
3. Verify subscription-based data collection
4. Monitor connection status

#### MQTT
1. Configure MQTT channel
2. Connect to MQTT broker
3. Subscribe to topic
4. Verify message parsing

### Load Testing

#### High-Frequency Data Collection
1. Configure 10+ channels with 1-second poll intervals
2. Run for 1 hour
3. Monitor:
   - Collector CPU/memory usage
   - Storage engine throughput
   - Database size growth
   - No data loss
4. Target: 10,000 points/second sustained

#### Multiple Concurrent Users
1. Open 5+ browser tabs
2. Login with different users (if available)
3. View different dashboards
4. Verify:
   - All receive live updates
   - No performance degradation
   - WebSocket connections stable

#### Long-Running Stability
1. Run system for 24+ hours
2. Monitor:
   - Memory leaks
   - Connection stability
   - Data continuity
   - Service uptime
3. Check logs for errors

## Test Results Documentation

### Test Execution Log

Create a test execution log for each test run:

```markdown
# Test Execution Log

**Date**: YYYY-MM-DD
**Tester**: Name
**Version**: 1.2.1
**Environment**: Development/Staging/Production

## Integration Tests
- [ ] Phase 1: Infrastructure - PASS/FAIL
- [ ] Phase 2: Admin API - PASS/FAIL
- [ ] Phase 3: Data Collection - PASS/FAIL
- [ ] Phase 4: Storage Engine - PASS/FAIL
- [ ] Phase 5: Analytics Engine - PASS/FAIL
- [ ] Phase 8: Admin UI - PASS/FAIL
- [ ] E2E Integration - PASS/FAIL

## Performance Tests
- [ ] API Response Times - PASS/FAIL
- [ ] Historical Queries - PASS/FAIL
- [ ] Concurrent Requests - PASS/FAIL
- [ ] Service Health - PASS/FAIL

## Security Tests
- [ ] Authentication - PASS/FAIL
- [ ] Authorization - PASS/FAIL
- [ ] Input Validation - PASS/FAIL
- [ ] API Security - PASS/FAIL

## Manual Tests
- [ ] Frontend Login - PASS/FAIL
- [ ] Dashboard Builder - PASS/FAIL
- [ ] Analytics Workspace - PASS/FAIL
- [ ] Admin Interface - PASS/FAIL

## Issues Found
1. [Issue description]
2. [Issue description]

## Notes
[Additional observations]
```

### Performance Metrics

Track performance metrics over time:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| API Response Time | <500ms | XXXms | ✓/✗ |
| Historical Query (8h) | <3s | X.XXs | ✓/✗ |
| Health Check | <200ms | XXXms | ✓/✗ |
| Data Throughput | 10k pts/s | XXXXk pts/s | ✓/✗ |
| Memory Usage (per service) | <500MB | XXXmb | ✓/✗ |
| WebSocket Latency | <150ms | XXXms | ✓/✗ |

## Troubleshooting

### Common Issues

#### Services Not Starting
```powershell
# Check Docker status
docker-compose ps

# View service logs
docker-compose logs [service-name]

# Restart services
docker-compose restart
```

#### Test Script Failures
```powershell
# Verify services are running
docker-compose ps

# Check service health
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health

# Check database connection
docker-compose exec postgres psql -U parx -d parx -c "SELECT 1"
```

#### Performance Issues
```powershell
# Check resource usage
docker stats

# Check database size
docker-compose exec postgres psql -U parx -d parx -c "SELECT pg_size_pretty(pg_database_size('parx'))"

# Check TimescaleDB compression
docker-compose exec postgres psql -U parx -d parx -c "SELECT * FROM timescaledb_information.compression_settings"
```

## Continuous Integration

### Automated Testing

For CI/CD pipelines, create a master test script:

```powershell
# test-all.ps1
Write-Host "Running all tests..." -ForegroundColor Cyan

$failed = 0

# Run integration tests
Write-Host "`nRunning integration tests..." -ForegroundColor Yellow
.\test-integration-e2e.ps1
if ($LASTEXITCODE -ne 0) { $failed++ }

# Run performance tests
Write-Host "`nRunning performance tests..." -ForegroundColor Yellow
.\test-performance.ps1
if ($LASTEXITCODE -ne 0) { $failed++ }

# Run security tests
Write-Host "`nRunning security tests..." -ForegroundColor Yellow
.\test-security.ps1
if ($LASTEXITCODE -ne 0) { $failed++ }

if ($failed -eq 0) {
    Write-Host "`nAll tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n$failed test suite(s) failed" -ForegroundColor Red
    exit 1
}
```

### GitHub Actions Workflow

```yaml
name: ParX Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for services
        run: sleep 30
      
      - name: Run tests
        run: pwsh ./test-all.ps1
      
      - name: Stop services
        run: docker-compose down
```

## Best Practices

### Before Testing
1. Ensure all services are running
2. Clear old test data
3. Check service logs for errors
4. Verify database connectivity

### During Testing
1. Monitor service logs in real-time
2. Watch resource usage
3. Document any anomalies
4. Take screenshots of UI issues

### After Testing
1. Clean up test data
2. Document results
3. File issues for failures
4. Update test scripts as needed

## Acceptance Criteria

### Phase 9 Complete When:
- [ ] All integration tests pass
- [ ] Performance targets met
- [ ] Security tests pass
- [ ] Manual testing complete
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Test results documented

---

**Version**: 1.2.1  
**Last Updated**: Phase 9  
**Next Phase**: Phase 10 - Deployment & Documentation
