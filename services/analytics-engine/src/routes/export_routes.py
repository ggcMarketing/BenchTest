from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import logging
import csv
import json
import io
import os
import tempfile

from ..database import db

logger = logging.getLogger(__name__)

router = APIRouter()

class ExportRequest(BaseModel):
    channels: List[str]
    startTime: int
    endTime: int
    format: str  # csv, xlsx, json, parquet
    filename: Optional[str] = None

@router.post("")
async def export_data(request: ExportRequest):
    """Export data to file"""
    try:
        # Fetch data
        conn = db.get_timescale_connection()
        cursor = conn.cursor()
        
        all_data = []
        
        for channel_id in request.channels:
            query = """
                SELECT 
                    EXTRACT(EPOCH FROM time) * 1000 AS timestamp,
                    value,
                    quality
                FROM channel_data
                WHERE channel_id = %s
                  AND time >= to_timestamp(%s::double precision / 1000)
                  AND time <= to_timestamp(%s::double precision / 1000)
                ORDER BY time ASC
            """
            
            cursor.execute(query, (channel_id, request.startTime, request.endTime))
            rows = cursor.fetchall()
            
            for row in rows:
                all_data.append({
                    'timestamp': int(row[0]),
                    'channel_id': channel_id,
                    'value': float(row[1]) if row[1] is not None else None,
                    'quality': row[2]
                })
        
        cursor.close()
        db.return_timescale_connection(conn)
        
        if not all_data:
            raise HTTPException(status_code=404, detail="No data found for export")
        
        # Generate filename
        filename = request.filename or f"export_{request.startTime}_{request.endTime}"
        
        # Export based on format
        if request.format == 'csv':
            return export_csv(all_data, filename)
        elif request.format == 'json':
            return export_json(all_data, filename)
        elif request.format == 'xlsx':
            return export_xlsx(all_data, filename)
        elif request.format == 'parquet':
            raise HTTPException(status_code=501, detail="Parquet export not yet implemented")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def export_csv(data: List[dict], filename: str):
    """Export data as CSV"""
    output = io.StringIO()
    
    if data:
        fieldnames = ['timestamp', 'channel_id', 'value', 'quality']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}.csv"
        }
    )

def export_json(data: List[dict], filename: str):
    """Export data as JSON"""
    json_str = json.dumps(data, indent=2)
    
    return StreamingResponse(
        iter([json_str]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}.json"
        }
    )

def export_xlsx(data: List[dict], filename: str):
    """Export data as Excel"""
    try:
        import openpyxl
        from openpyxl import Workbook
        
        wb = Workbook()
        ws = wb.active
        ws.title = "Data"
        
        # Write headers
        if data:
            headers = ['timestamp', 'channel_id', 'value', 'quality']
            ws.append(headers)
            
            # Write data
            for row in data:
                ws.append([row.get(h) for h in headers])
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        wb.save(temp_file.name)
        temp_file.close()
        
        return FileResponse(
            temp_file.name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=f"{filename}.xlsx",
            background=lambda: os.unlink(temp_file.name)
        )
        
    except ImportError:
        raise HTTPException(status_code=501, detail="Excel export requires openpyxl package")
    except Exception as e:
        logger.error(f"Excel export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
