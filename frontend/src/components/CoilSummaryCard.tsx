import React, { useEffect, useState } from 'react';
import { coilsAPI } from '../services/api';
import { useAppStore } from '../store/appStore';

export const CoilSummaryCard: React.FC = () => {
  const { activeCoil, setActiveCoil } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoilStatus = async () => {
      try {
        const response = await coilsAPI.getCurrent();
        setActiveCoil({
          id: response.data.currentCoilId,
          status: 'active',
          startTime: Date.now() - (response.data.position / response.data.speed * 60000),
          targetThickness: response.data.thickness,
          targetWidth: response.data.width,
          length: response.data.position,
          targetLength: 1600,
          progress: response.data.progress
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching coil status:', error);
        setLoading(false);
      }
    };

    fetchCoilStatus();
    const interval = setInterval(fetchCoilStatus, 2000);

    return () => clearInterval(interval);
  }, [setActiveCoil]);

  if (loading || !activeCoil) {
    return (
      <div style={{
        background: '#2C2C2C',
        borderRadius: '8px',
        padding: '20px',
        color: '#999'
      }}>
        Loading coil information...
      </div>
    );
  }

  const progress = activeCoil.progress || 0;

  return (
    <div style={{
      background: '#2C2C2C',
      borderRadius: '8px',
      padding: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#ECECEC' }}>
        Active Coil: {activeCoil.id}
      </h3>

      <div style={{ marginBottom: '15px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          color: '#999',
          fontSize: '14px'
        }}>
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div style={{
          background: '#1E1E1E',
          borderRadius: '4px',
          height: '20px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #2ECC71, #27AE60)',
            height: '100%',
            width: `${progress}%`,
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        color: '#ECECEC',
        fontSize: '14px'
      }}>
        <div>
          <div style={{ color: '#999', fontSize: '12px' }}>Length</div>
          <div style={{ fontWeight: 'bold' }}>
            {(activeCoil.length || 0).toFixed(0)} / {activeCoil.targetLength} m
          </div>
        </div>
        <div>
          <div style={{ color: '#999', fontSize: '12px' }}>Target Thickness</div>
          <div style={{ fontWeight: 'bold' }}>
            {activeCoil.targetThickness?.toFixed(2)} mm
          </div>
        </div>
        <div>
          <div style={{ color: '#999', fontSize: '12px' }}>Target Width</div>
          <div style={{ fontWeight: 'bold' }}>
            {activeCoil.targetWidth} mm
          </div>
        </div>
        <div>
          <div style={{ color: '#999', fontSize: '12px' }}>Runtime</div>
          <div style={{ fontWeight: 'bold' }}>
            {Math.floor((Date.now() - activeCoil.startTime) / 60000)} min
          </div>
        </div>
      </div>
    </div>
  );
};
