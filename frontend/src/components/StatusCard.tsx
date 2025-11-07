import React from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  icon?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  unit = '',
  status = 'normal',
  icon
}) => {
  const statusColors = {
    normal: '#2ECC71',
    warning: '#F39C12',
    critical: '#E74C3C'
  };

  const statusColor = statusColors[status];

  return (
    <div style={{
      background: '#2C2C2C',
      borderRadius: '8px',
      padding: '20px',
      border: `2px solid ${statusColor}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        color: '#999',
        fontSize: '14px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {icon && <span>{icon}</span>}
        {title}
      </div>
      <div style={{
        color: '#ECECEC',
        fontSize: '32px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px'
      }}>
        <span>{value}</span>
        {unit && <span style={{ fontSize: '18px', color: '#999' }}>{unit}</span>}
      </div>
    </div>
  );
};
