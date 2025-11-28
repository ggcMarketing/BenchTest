# ParX v1.2.1 - Quick Start Guide

## 🚀 Getting Started (Fastest Way)

### Option 1: Use the Startup Script (Recommended)

Simply run:
```powershell
.\start-parx-v1.2.1.ps1
```

This will:
1. Check if services are already running
2. Start the backend if needed
3. Start the frontend v1.2.1 if needed
4. Open your browser automatically

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd frontend-v2
npm run dev
```

## 🌐 Access the Application

**URL**: http://localhost:5173

**Default Credentials**:
- Username: `admin`
- Password: `admin123`

## ✨ What's New in v1.2.1 UI

### Dashboard Features
- **Modern React Interface** - Built with React 18 + TypeScript
- **Real-time Updates** - WebSocket integration for live data
- **Drag & Drop Builder** - Create custom dashboards
- **Live Widgets**:
  - Value Cards - Display current values
  - Trend Graphs - Multi-channel plotting
  - Progress Bars - Visual indicators
  - Alarm Log - Event tracking

### Analytics Workspace
- **Historical Data Viewer** - Query and visualize past data
- **Time Range Selector** - 1h, 8h, 24h, 7d presets
- **Multi-Channel Plotting** - Compare multiple signals
- **Derived Signals** - Create calculated signals
- **Data Export** - CSV, JSON, XLSX formats

### Admin Interface
- **System Monitoring** - Real-time service health
- **I/O Channel Configuration** - Manage data sources
- **Storage Rule Configuration** - Control data logging
- **User Management** - View users and roles

## 🔧 Current Setup

### What's Running
- ✅ **Backend API** (port 3001) - Original backend with full functionality
- ✅ **Frontend v1.2.1** (port 5173) - New React UI
- ✅ **PostgreSQL** (port 5432) - Configuration database
- ✅ **TimescaleDB** (port 5433) - Time-series database
- ✅ **Redis** (port 6379) - Cache and pub/sub

### What's NOT Running (Yet)
- ⚠️ **Microservices** - The 5 new microservices are built but not running
  - admin-api
  - data-router
  - collector
  - storage-engine
  - analytics-engine

**Why?** The microservices have some configuration issues that need debugging. The current setup uses the proven backend which already works perfectly.

## 📊 Features Available Now

### ✅ Working Features
- Login and authentication
- Dashboard viewing
- Real-time data display
- WebSocket streaming
- Mock data generation
- Historical data queries
- Data export
- Admin configuration UI

### ⚠️ Limited Features
- Some admin functions may be read-only
- Microservices-specific features not available yet

## 🛑 Stopping the Services

### Stop All Services
```powershell
# Find the PowerShell windows running npm and close them
# Or use Task Manager to end node.exe processes
```

### Stop Individual Services
- Close the PowerShell window for that service
- Or press `Ctrl+C` in the terminal

## 🔄 Restarting

If you need to restart:

1. **Stop all services** (close PowerShell windows)
2. **Run the startup script again**:
   ```powershell
   .\start-parx-v1.2.1.ps1
   ```

## 🐛 Troubleshooting

### Frontend Not Loading
```powershell
cd frontend-v2
npm install
npm run dev
```

### Backend Not Responding
```powershell
cd backend
npm install
npm start
```

### Port Already in Use
```powershell
# Find what's using the port
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Issues
```powershell
# Check if databases are running
docker ps

# If not, start them
docker-compose up -d postgres timescaledb redis
```

## 📝 Notes

### Current Architecture
```
Browser (http://localhost:5173)
    ↓
Frontend v1.2.1 (React + TypeScript)
    ↓
Backend API (http://localhost:3001)
    ↓
PostgreSQL + TimescaleDB + Redis
```

### Future Architecture (When Microservices are Fixed)
```
Browser (http://localhost:5173)
    ↓
Frontend v1.2.1 (React + TypeScript)
    ↓
┌─────────────────────────────────────┐
│  Microservices (5 services)         │
│  - Admin API (3000)                 │
│  - Data Router (3001)               │
│  - Collector (3002)                 │
│  - Storage Engine (3003)            │
│  - Analytics Engine (3004)          │
└─────────────────────────────────────┘
    ↓
PostgreSQL + TimescaleDB + Redis
```

## 🎯 Next Steps

### To Use ParX v1.2.1 Now
1. Run `.\start-parx-v1.2.1.ps1`
2. Open http://localhost:5173
3. Login with admin/admin123
4. Explore the new UI!

### To Complete Microservices Setup (Future)
1. Fix analytics-engine Python import issue
2. Debug Node.js service startup issues
3. Verify all service connectivity
4. Test end-to-end data flow
5. Switch frontend to use microservices

## 📚 Additional Resources

- **Documentation**: See `docs/` directory
- **API Spec**: `docs/API-SPEC-v1.2.1.md`
- **Architecture**: `docs/ARCHITECTURE-v1.2.1.md`
- **Admin Guide**: `docs/ADMIN-UI-GUIDE.md`
- **Testing**: `docs/TESTING-GUIDE.md`

## 💡 Tips

1. **Keep terminals open** - Don't close the PowerShell windows while using ParX
2. **Check logs** - If something isn't working, check the terminal output
3. **Refresh browser** - If UI seems stuck, refresh the page
4. **Clear cache** - If you see old UI, clear browser cache (Ctrl+Shift+Delete)

---

**Version**: 1.2.1  
**Status**: Frontend + Backend Working  
**Last Updated**: November 2024

**Enjoy using ParX v1.2.1! 🚀**
