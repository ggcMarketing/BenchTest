from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import numpy as np
import pandas as pd

from ..database import db

logger = logging.getLogger(__name__)

router = APIRouter()

class EvaluateRequest(BaseModel):
    formula: str
    channels: List[str]
    startTime: int
    endTime: int

class DerivedSignal(BaseModel):
    id: Optional[str] = None
    name: str
    formula: str
    units: Optional[str] = None
    description: Optional[str] = None
    sourceChannels: List[str]

@router.post("/evaluate")
async def evaluate_derived_signal(request: EvaluateRequest):
    """Evaluate a derived signal formula"""
    try:
        # Fetch data for all channels
        conn = db.get_timescale_connection()
        cursor = conn.cursor()
        
        channel_data = {}
        
        for channel_id in request.channels:
            query = """
                SELECT 
                    EXTRACT(EPOCH FROM time) * 1000 AS timestamp,
                    value
                FROM channel_data
                WHERE channel_id = %s
                  AND time >= to_timestamp(%s::double precision / 1000)
                  AND time <= to_timestamp(%s::double precision / 1000)
                ORDER BY time ASC
            """
            
            cursor.execute(query, (channel_id, request.startTime, request.endTime))
            rows = cursor.fetchall()
            
            if rows:
                df = pd.DataFrame(rows, columns=['timestamp', 'value'])
                channel_data[channel_id] = df
        
        cursor.close()
        db.return_timescale_connection(conn)
        
        if not channel_data:
            raise HTTPException(status_code=404, detail="No data found for specified channels")
        
        # Evaluate formula
        result = evaluate_formula(request.formula, channel_data)
        
        return {
            'data': result,
            'formula': request.formula,
            'channels': request.channels
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating derived signal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def evaluate_formula(formula: str, channel_data: Dict[str, pd.DataFrame]) -> List[Dict[str, Any]]:
    """Evaluate formula with channel data"""
    try:
        # Create a common timestamp index by merging all dataframes
        if not channel_data:
            return []
        
        # Start with first channel
        first_channel = list(channel_data.keys())[0]
        merged = channel_data[first_channel].copy()
        merged = merged.rename(columns={'value': first_channel})
        
        # Merge other channels
        for channel_id in list(channel_data.keys())[1:]:
            df = channel_data[channel_id].copy()
            df = df.rename(columns={'value': channel_id})
            merged = pd.merge(merged, df, on='timestamp', how='outer')
        
        # Sort by timestamp and forward fill missing values
        merged = merged.sort_values('timestamp')
        merged = merged.fillna(method='ffill')
        
        # Create namespace for formula evaluation
        namespace = {
            'np': np,
            'pd': pd,
            'avg': np.mean,
            'sum': np.sum,
            'min': np.min,
            'max': np.max,
            'abs': np.abs,
            'sqrt': np.sqrt,
            'sin': np.sin,
            'cos': np.cos,
        }
        
        # Add channel data to namespace
        for channel_id in channel_data.keys():
            namespace[channel_id.replace('-', '_')] = merged[channel_id].values
        
        # Evaluate formula
        result_values = eval(formula, namespace)
        
        # Convert to list of dicts
        result = []
        for i, timestamp in enumerate(merged['timestamp']):
            value = result_values[i] if hasattr(result_values, '__iter__') else result_values
            result.append({
                'timestamp': int(timestamp),
                'value': float(value) if not np.isnan(value) else None
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Formula evaluation error: {e}")
        raise ValueError(f"Invalid formula: {str(e)}")

@router.post("/signals", response_model=DerivedSignal)
async def create_derived_signal(signal: DerivedSignal):
    """Create a derived signal definition"""
    try:
        conn = db.get_config_connection()
        cursor = conn.cursor()
        
        signal_id = signal.id or f"derived-{int(pd.Timestamp.now().timestamp() * 1000)}"
        
        query = """
            INSERT INTO derived_signals (id, name, formula, units, description, source_channels)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        cursor.execute(query, (
            signal_id,
            signal.name,
            signal.formula,
            signal.units,
            signal.description,
            signal.sourceChannels
        ))
        
        conn.commit()
        cursor.close()
        db.return_config_connection(conn)
        
        signal.id = signal_id
        return signal
        
    except Exception as e:
        logger.error(f"Error creating derived signal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/signals")
async def list_derived_signals():
    """List all derived signals"""
    try:
        conn = db.get_config_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT id, name, formula, units, description, source_channels
            FROM derived_signals
            ORDER BY name
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        cursor.close()
        db.return_config_connection(conn)
        
        signals = [
            {
                'id': row[0],
                'name': row[1],
                'formula': row[2],
                'units': row[3],
                'description': row[4],
                'sourceChannels': row[5]
            }
            for row in rows
        ]
        
        return {'signals': signals}
        
    except Exception as e:
        logger.error(f"Error listing derived signals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/signals/{signal_id}")
async def delete_derived_signal(signal_id: str):
    """Delete a derived signal"""
    try:
        conn = db.get_config_connection()
        cursor = conn.cursor()
        
        query = "DELETE FROM derived_signals WHERE id = %s RETURNING id"
        cursor.execute(query, (signal_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Derived signal not found")
        
        conn.commit()
        cursor.close()
        db.return_config_connection(conn)
        
        return {'message': 'Derived signal deleted successfully'}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting derived signal: {e}")
        raise HTTPException(status_code=500, detail=str(e))
