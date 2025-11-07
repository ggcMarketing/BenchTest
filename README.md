# ParX - Industrial Analytics Platform MVP

A production-ready MVP for industrial process monitoring and analytics, featuring real-time data visualization, historical trend analysis, and role-based dashboards for manufacturing operations.

## Features

- **Real-time Process Monitoring**: WebSocket-based live data streaming with <100ms latency
- **Interactive Trend Visualization**: Multi-signal trend charts powered by ECharts
- **Cross-Width Profile Analysis**: 64-zone thickness profile monitoring
- **Role-Based Dashboards**: Customized views for Operators, Engineers, and Managers
- **Mock Data Generator**: Simulated OPC UA tags for demo and development
- **Historical Data Storage**: SQLite-based time-series data retention
- **Alarm Management**: Real-time alert detection and notification

## Tech Stack

### Backend
- Node.js + Express
- Socket.io (WebSocket server)
- SQLite (better-sqlite3)
- Mock OPC UA data generator

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Zustand (state management)
- ECharts (visualization)
- Axios (HTTP client)
- React Router (navigation)

## Project Structure

```
parx-mvp/
├── backend/
│   ├── server.js                 # Express + WebSocket server
│   ├── mockDataGenerator.js     # Simulated industrial tags
│   ├── database.js               # SQLite database layer
│   ├── package.json
│   ├── Dockerfile
│   └── data/                     # SQLite database files (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TrendViewer.tsx
│   │   │   ├── ProfileChart.tsx
│   │   │   ├── StatusCard.tsx
│   │   │   ├── AlertPanel.tsx
│   │   │   └── CoilSummaryCard.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AnalyticsWorkspace.tsx
│   │   │   └── Login.tsx
│   │   ├── services/
│   │   │   ├── websocketClient.ts
│   │   │   └── api.ts
│   │   ├── store/
│   │   │   └── appStore.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- **Node.js 18+** (for local development)
- **Docker & Docker Compose** (for containerized deployment)

### Option 1: Local Development (Without Docker)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BenchTest
   ```

2. **Start the Backend**
   ```bash
   cd backend
   npm install
   node server.js
   ```
   Backend will run on http://localhost:3001

3. **Start the Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will run on http://localhost:5173

4. **Access the application**
   - Open http://localhost:5173 in your browser
   - Use the quick login buttons or credentials below

### Option 2: Docker Deployment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BenchTest
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## Default User Credentials

The system comes with three pre-configured demo users:

| Role     | Username   | Password | Access Level                    |
|----------|------------|----------|---------------------------------|
| Operator | operator1  | pass123  | Dashboard only                  |
| Engineer | engineer1  | pass123  | Dashboard + Analytics           |
| Manager  | manager1   | pass123  | Dashboard + Analytics + Reports |

## Application Features

### Operator Dashboard
- Live status cards (Speed, Thickness, Temperature, Tension)
- Active coil progress tracking
- Quick trends (4 key signals, 5-minute window)
- Real-time alarm panel

### Analytics Workspace (Engineer/Manager)
- Advanced trend viewer (8+ signals, 10-minute window)
- Cross-width thickness profile (64 zones)
- Coil statistics (avg, std dev, min, max)
- Tag browser with dynamic subscription
- Data export (CSV/JSON)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Tags
- `GET /api/tags` - Get tag tree structure
- `GET /api/tags/list` - Get all available tags
- `GET /api/historical/:tagPath` - Get historical data for a tag

### Coils
- `GET /api/coils` - Get all coils
- `GET /api/coils/:coilId` - Get specific coil details
- `GET /api/coil/current` - Get current active coil status
- `GET /api/profile/:coilId` - Get cross-width profile data

### Alarms
- `GET /api/alarms` - Get active alarms

### Health
- `GET /api/health` - Server health check

## WebSocket Events

### Client → Server
- `subscribe` - Subscribe to tag updates
- `unsubscribe` - Unsubscribe from tag updates

### Server → Client
- `tagUpdate` - Real-time tag value update
- `alarm` - Alarm notification

## Mock Data Generator

The system includes a sophisticated mock data generator that simulates:

- **12 Industrial Tags**: Furnace zones, mill parameters, tensions, flow rates
- **Analog Signals**: Sinusoidal variation + noise + anomalies
- **Digital Signals**: Status indicators with realistic uptime
- **Coil Lifecycle**: Automatic progression through coil processing
- **Cross-Width Profiles**: 64-zone thickness distribution with crown effect

## Performance Targets

- Tag update latency: <100ms (WebSocket → UI)
- Dashboard load time: <2s
- Trend rendering: 10,000 points at 60fps
- Concurrent users: 50+
- Data retention: 7 days (configurable)

## Development

### Backend Development
```bash
cd backend
npm install
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Hot module replacement enabled
```

### Building for Production
```bash
cd frontend
npm run build  # Creates optimized production build in dist/
```

## Configuration

### Backend Environment Variables
Create `backend/.env`:
```
PORT=3001
NODE_ENV=development
```

### Frontend Environment Variables
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:3001
```

## Troubleshooting

### WebSocket Connection Issues
- Ensure backend is running on port 3001
- Check CORS settings in `backend/server.js`
- Verify `VITE_API_URL` in frontend environment

### Database Issues
- Database file is auto-created in `backend/data/parx.db`
- Delete the database file to reset: `rm backend/data/parx.db`

### Port Already in Use
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

## Future Enhancements

1. **Real OPC UA Integration**: Replace mock server with node-opcua client
2. **Edge Deployment**: Package as Snap/Docker for ARM64 industrial PCs
3. **Advanced Analytics**: Python microservice for ML predictions
4. **TimescaleDB**: Production-scale time-series database
5. **User Customization**: Save/load dashboard layouts
6. **PDF Reporting**: Automated shift reports

## Architecture Highlights

- **Mock-First Design**: Enables development without hardware dependencies
- **Modular Components**: Easy to swap mock data for real OPC UA
- **Real-Time First**: WebSocket architecture for <100ms latency
- **Industrial Dark Theme**: Optimized for 24/7 control room displays
- **Role-Based Access**: Customized experiences per user type

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.

---

**Built with industrial-grade technologies for production reliability**
