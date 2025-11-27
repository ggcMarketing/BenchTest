from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from ..database import db

logger = logging.getLogger(__name__)

router = APIRouter()

class Batch(BaseModel):
    id: str
    startTime: int
    endTime: Optional[int]
    status: str
    metadata: Optional[Dict[str, Any]]

@router.get("")
async def list_batches(
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    status: Optional[str] = None
):
    """List batches/coils"""
    try:
        conn = db.get_config_connection()
        cursor = conn.cursor()
        
        query = "SELECT id, start_time, end_time, status, metadata FROM batches WHERE 1=1"
        params = []
        
        if start_time:
            query += " AND start_time >= to_timestamp(%s::double precision / 1000)"
            params.append(start_time)
        
        if end_time:
            query += " AND start_time <= to_timestamp(%s::double precision / 1000)"
            params.append(end_time)
        
        if status:
            query += " AND status = %s"
            params.append(status)
        
        query += " ORDER BY start_time DESC LIMIT 100"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        cursor.close()
        db.return_config_connection(conn)
        
        batches = [
            {
                'id': row[0],
                'startTime': int(row[1].timestamp() * 1000) if row[1] else None,
                'endTime': int(row[2].timestamp() * 1000) if row[2] else None,
                'status': row[3],
                'metadata': row[4]
            }
            for row in rows
        ]
        
        return {'batches': batches}
        
    except Exception as e:
        logger.error(f"Error listing batches: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{batch_id}")
async def get_batch(batch_id: str):
    """Get batch details"""
    try:
        conn = db.get_config_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT id, start_time, end_time, status, metadata
            FROM batches
            WHERE id = %s
        """
        
        cursor.execute(query, (batch_id,))
        row = cursor.fetchone()
        
        cursor.close()
        db.return_config_connection(conn)
        
        if not row:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        return {
            'id': row[0],
            'startTime': int(row[1].timestamp() * 1000) if row[1] else None,
            'endTime': int(row[2].timestamp() * 1000) if row[2] else None,
            'status': row[3],
            'metadata': row[4]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{batch_id}/data")
async def get_batch_data(
    batch_id: str,
    channels: Optional[str] = None
):
    """Get data for a specific batch"""
    try:
        conn = db.get_timescale_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                EXTRACT(EPOCH FROM time) * 1000 AS timestamp,
                channel_id,
                value,
                quality
            FROM batch_data
            WHERE batch_id = %s
        """
        
        params = [batch_id]
        
        if channels:
            channel_list = channels.split(',')
            query += " AND channel_id = ANY(%s)"
            params.append(channel_list)
        
        query += " ORDER BY time ASC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        cursor.close()
        db.return_timescale_connection(conn)
        
        # Group by channel
        data_by_channel = {}
        for row in rows:
            channel_id = row[1]
            if channel_id not in data_by_channel:
                data_by_channel[channel_id] = []
            
            data_by_channel[channel_id].append({
                'timestamp': int(row[0]),
                'value': float(row[2]) if row[2] is not None else None,
                'quality': row[3]
            })
        
        return {
            'batchId': batch_id,
            'data': data_by_channel
        }
        
    except Exception as e:
        logger.error(f"Error getting batch data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
