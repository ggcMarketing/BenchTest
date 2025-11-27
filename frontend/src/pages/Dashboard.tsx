import React, { useEffect } from 'react';
import { TrendViewer } from '../components/TrendViewer';
import { StatusCard } from '../components/StatusCard';
import { AlertPanel } from '../components/AlertPanel';
import { CoilSummaryCard } from '../components/CoilSummaryCard';
import { wsClient, TagData } from '../services/websocketClient';
import { useAppStore } from '../store/appStore';

const OPERATOR_TAGS = [
  'Line1/Mill/Speed',
  'Line1/Mill/Thickness',
  'Line1/Furnace/Zone3_Temp',
  'Line1/Tension/Entry'
];

export const Dashboard: React.FC = () => {
  const { updateTag, subscribedTags, addAlert } = useAppStore();

  useEffect(() => {
    // Connect to WebSocket
    wsClient.connect();

    // Subscribe to status tags for cards
    const statusCallback = (data: TagData) => {
      updateTag(data.tagPath, {
        tagPath: data.tagPath,
        latestValue: data.value,
        quality: data.quality,
        timestamp: data.timestamp
      });
    };

    OPERATOR_TAGS.forEach(tag => {
      wsClient.subscribe(tag, statusCallback);
    });

    // Subscribe to alarms
    const alarmCallback = (alarm: any) => {
      addAlert({
        severity: alarm.severity,
        message: alarm.message,
        timestamp: alarm.timestamp,
        tagPath: alarm.tagPath
      });
    };

    wsClient.onAlarm(alarmCallback);

    return () => {
      OPERATOR_TAGS.forEach(tag => {
        wsClient.unsubscribe(tag, statusCallback);
      });
      wsClient.offAlarm(alarmCallback);
    };
  }, [updateTag, addAlert]);

  const speedTag = subscribedTags.get('Line1/Mill/Speed');
  const thicknessTag = subscribedTags.get('Line1/Mill/Thickness');
  const tempTag = subscribedTags.get('Line1/Furnace/Zone3_Temp');
  const tensionTag = subscribedTags.get('Line1/Tension/Entry');

  return (
    <div style={{
      padding: '20px',
      background: '#1E1E1E',
      minHeight: '100vh',
      color: '#ECECEC'
    }}>
      <div style={{
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Operator Dashboard</h1>
        <p style={{ color: '#999', margin: 0 }}>Line 1 - Rolling Mill Operations</p>
      </div>

      {/* Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <StatusCard
          title="Line Speed"
          value={speedTag?.latestValue.toFixed(1) || '--'}
          unit="m/min"
          status={speedTag && speedTag.latestValue > 100 ? 'normal' : 'warning'}
          icon="⚡"
        />
        <StatusCard
          title="Thickness"
          value={thicknessTag?.latestValue.toFixed(2) || '--'}
          unit="mm"
          status="normal"
          icon="📏"
        />
        <StatusCard
          title="Furnace Zone 3"
          value={tempTag?.latestValue.toFixed(0) || '--'}
          unit="°C"
          status={tempTag && tempTag.latestValue > 1070 ? 'warning' : 'normal'}
          icon="🔥"
        />
        <StatusCard
          title="Entry Tension"
          value={tensionTag?.latestValue.toFixed(1) || '--'}
          unit="kN"
          status="normal"
          icon="⚙️"
        />
      </div>

      {/* Active Coil */}
      <div style={{ marginBottom: '20px' }}>
        <CoilSummaryCard />
      </div>

      {/* Trends */}
      <div style={{
        background: '#2C2C2C',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <TrendViewer
          tags={OPERATOR_TAGS}
          timeWindow={300}
          height={350}
          title="Quick Trends (Last 5 Minutes)"
        />
      </div>

      {/* Alarms */}
      <AlertPanel />
    </div>
  );
};
