from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

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

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "analytics-engine",
        "version": "1.2.1",
        "timestamp": int(os.times().elapsed * 1000)
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3004))
    logger.info(f"Starting Analytics Engine on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
