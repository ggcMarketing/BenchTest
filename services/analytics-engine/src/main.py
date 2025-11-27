from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from .database import db
from .routes import analytics, derived, batches, export_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [analytics-engine] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ParX Analytics Engine",
    version="1.2.1",
    description="Historical data queries and derived signal computation"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database connections on startup"""
    db.initialize()
    logger.info("Analytics Engine started")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    db.close()
    logger.info("Analytics Engine stopped")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        conn = db.get_timescale_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        db.return_timescale_connection(conn)
        
        return {
            "status": "ok",
            "service": "analytics-engine",
            "version": "1.2.1",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "service": "analytics-engine",
            "message": str(e)
        }

@app.get("/api/v1")
async def api_info():
    """API information"""
    return {
        "service": "ParX Analytics Engine",
        "version": "1.2.1",
        "endpoints": {
            "query": "/api/v1/analytics/query",
            "derived": "/api/v1/analytics/derived",
            "batches": "/api/v1/analytics/batches",
            "export": "/api/v1/analytics/export"
        }
    }

# Mount routes
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(derived.router, prefix="/api/v1/analytics/derived", tags=["derived"])
app.include_router(batches.router, prefix="/api/v1/analytics/batches", tags=["batches"])
app.include_router(export_routes.router, prefix="/api/v1/analytics/export", tags=["export"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3004))
    logger.info(f"Starting Analytics Engine on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
