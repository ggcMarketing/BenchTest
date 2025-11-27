import React from 'react';
import { useAppStore } from '../store/appStore';

export const AlertPanel: React.FC = () => {
  const { alerts, clearAlert, clearAllAlerts } = useAppStore();

  const severityColors = {
    INFO: '#3498DB',
    WARNING: '#F39C12',
    CRITICAL: '#E74C3C'
  };

  const severityIcons = {
    INFO: 'ℹ️',
    WARNING: '⚠️',
    CRITICAL: '🔴'
  };

  if (alerts.length === 0) {
    return (
      <div style={{
        background: '#2C2C2C',
        borderRadius: '8px',
        padding: '20px',
        color: '#999'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#ECECEC' }}>Active Alarms</h3>
        <p>No active alarms</p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#2C2C2C',
      borderRadius: '8px',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0, color: '#ECECEC' }}>Active Alarms ({alerts.length})</h3>
        <button
          onClick={clearAllAlerts}
          style={{
            background: '#555',
            border: 'none',
            color: '#ECECEC',
            padding: '5px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear All
        </button>
      </div>

      <div style={{
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        {alerts.map(alert => (
          <div
            key={alert.id}
            style={{
              background: '#1E1E1E',
              borderLeft: `4px solid ${severityColors[alert.severity]}`,
              padding: '12px',
              marginBottom: '8px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <span>{severityIcons[alert.severity]}</span>
                <span style={{
                  color: severityColors[alert.severity],
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {alert.severity}
                </span>
                <span style={{ color: '#666', fontSize: '11px' }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ color: '#ECECEC', fontSize: '14px' }}>
                {alert.message}
              </div>
              {alert.tagPath && (
                <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>
                  {alert.tagPath}
                </div>
              )}
            </div>
            <button
              onClick={() => clearAlert(alert.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 5px'
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
