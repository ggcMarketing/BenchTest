from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from ..database import db

logger = logging.getLogger(__name__)

router = APIRouter()

class QueryRequest(BaseModel):
    channels: List[str]
    startTime: int
    endTime: int
    aggregation: Optional[Dict[str, Any]] = None
    limit: Optional[int] = 10000

class QueryResponse(BaseModel):
    data: Dict[str, List[Dict[str, Any]]]
    metadata: Dict[str, Any]

@router.post("/query", response_model=QueryResponse)
async def query_historical_data(request: QueryRequest):
    """Query historical data for multiple channels"""
    try:
        conn = db.get_timescale_connection()
        cursor = conn.cursor()
        
        result_data = {}
        total_points = 0
        
        for channel_id in request.channels:
            if request.aggregation:
                # Query aggregated data
                interval = request.aggregation.get('interval', '1m')
                function = request.aggregation.get('function', 'avg')
                
                query = f"""
                    SELECT 
                        EXTRACT(EPOCH FROM bucket) * 1000 AS timestamp,
                        {function}_value AS value,
                        sample_count
                    FROM channel_data_{interval}
                    WHERE channel_id = %s
                      AND bucket >= to_timestamp(%s::double precision / 1000)
                      AND bucket <= to_timestamp(%s::double precision / 1000)
                    ORDER BY bucket DESC
                    LIMIT %s
                """
                
                cursor.execute(query, (
                    channel_id,
                    request.startTime,
                    request.endTime,
                    request.limit
                ))
                
                rows = cursor.fetchall()
                result_data[channel_id] = [
                    {
                        'timestamp': int(row[0]),
                        'value': float(row[1]) if row[1] is not None else None,
                        'count': int(row[2]) if row[2] is not None else 0
                    }
                    for row in rows
                ]
            else:
                # Query raw data
                query = """
                    SELECT 
                        EXTRACT(EPOCH FROM time) * 1000 AS timestamp,
                        value,
                        quality
                    FROM channel_data
                    WHERE channel_id = %s
                      AND time >= to_timestamp(%s::double precision / 1000)
                      AND time <= to_timestamp(%s::double precision / 1000)
                    ORDER BY time DESC
                    LIMIT %s
                """
                
                cursor.execute(query, (
                    channel_id,
                    request.startTime,
                    request.endTime,
                    request.limit
                ))
                
                rows = cursor.fetchall()
                result_data[channel_id] = [
                    {
                        'timestamp': int(row[0]),
                        'value': float(row[1]) if row[1] is not None else None,
                        'quality': row[2]
                    }
                    for row in rows
                ]
            
            total_points += len(result_data[channel_id])
        
        cursor.close()
        db.return_timescale_connection(conn)
        
        return QueryResponse(
            data=result_data,
            metadata={
                'totalPoints': total_points,
                'channels': len(request.channels),
                'aggregated': request.aggregation is not None
            }
        )
        
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/channels/{channel_id}/latest")
async def get_latest_value(channel_id: str):
    """Get latest value for a channel"""
    try:
        conn = db.get_timescale_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                EXTRACT(EPOCH FROM time) * 1000 AS timestamp,
                value,
                quality
            FROM channel_data
            WHERE channel_id = %s
            ORDER BY time DESC
            LIMIT 1
        """
        
        cursor.execute(query, (channel_id,))
        row = cursor.fetchone()
        
        cursor.close()
        db.return_timescale_connection(conn)
        
        if not row:
            raise HTTPException(status_code=404, detail="No data found for channel")
        
        return {
            'channelId': channel_id,
            'timestamp': int(row[0]),
            'value': float(row[1]) if row[1] is not None else None,
            'quality': row[2]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting latest value: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/channels/{channel_id}/stats")
async def get_channel_stats(
    channel_id: str,
    start_time: int,
    end_time: int
):
    """Get statistical summary for a channel"""
    try:
        conn = db.get_timescale_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                COUNT(*) as count,
                AVG(value) as avg,
                MIN(value) as min,
                MAX(value) as max,
                STDDEV(value) as stddev
            FROM channel_data
            WHERE channel_id = %s
              AND time >= to_timestamp(%s::double precision / 1000)
              AND time <= to_timestamp(%s::double precision / 1000)
        """
        
        cursor.execute(query, (channel_id, start_time, end_time))
        row = cursor.fetchone()
        
        cursor.close()
        db.return_timescale_connection(conn)
        
        return {
            'channelId': channel_id,
            'count': int(row[0]) if row[0] else 0,
            'avg': float(row[1]) if row[1] is not None else None,
            'min': float(row[2]) if row[2] is not None else None,
            'max': float(row[3]) if row[3] is not None else None,
            'stddev': float(row[4]) if row[4] is not None else None
        }
        
    except Exception as e:
        logger.error(f"Error getting channel stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
