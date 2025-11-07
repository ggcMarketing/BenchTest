import React, { useState, useEffect } from 'react';
import { TrendViewer } from '../components/TrendViewer';
import { ProfileChart } from '../components/ProfileChart';
import { wsClient } from '../services/websocketClient';
import { coilsAPI } from '../services/api';
import { useAppStore } from '../store/appStore';

const ANALYTICS_TAGS = [
  'Line1/Furnace/Zone1_Temp',
  'Line1/Furnace/Zone2_Temp',
  'Line1/Furnace/Zone3_Temp',
  'Line1/Furnace/Zone4_Temp',
  'Line1/Mill/Speed',
  'Line1/Mill/Thickness',
  'Line1/Tension/Entry',
  'Line1/Tension/Exit'
];

export const AnalyticsWorkspace: React.FC = () => {
  const { activeCoil } = useAppStore();
  const [selectedTags, setSelectedTags] = useState<string[]>(ANALYTICS_TAGS.slice(0, 4));
  const [coilHistory, setCoilHistory] = useState<any[]>([]);

  useEffect(() => {
    wsClient.connect();

    // Fetch coil history
    const fetchCoils = async () => {
      try {
        const response = await coilsAPI.getAll();
        setCoilHistory(response.data.coils);
      } catch (error) {
        console.error('Error fetching coils:', error);
      }
    };

    fetchCoils();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#1E1E1E',
      color: '#ECECEC'
    }}>
      {/* Sidebar - Tag Browser */}
      <div style={{
        width: '250px',
        background: '#2C2C2C',
        padding: '20px',
        overflowY: 'auto',
        borderRight: '1px solid #333'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Tag Browser</h3>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', color: '#999', margin: '0 0 10px 0' }}>
            Available Tags
          </h4>
          {ANALYTICS_TAGS.map(tag => (
            <div
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                padding: '8px',
                background: selectedTags.includes(tag) ? '#3498DB' : '#1E1E1E',
                marginBottom: '5px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'background 0.2s'
              }}
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => {}}
                style={{ marginRight: '8px' }}
              />
              {tag.split('/').pop()}
            </div>
          ))}
        </div>

        <div>
          <h4 style={{ fontSize: '14px', color: '#999', margin: '0 0 10px 0' }}>
            Recent Coils
          </h4>
          {coilHistory.slice(0, 5).map(coil => (
            <div
              key={coil.id}
              style={{
                padding: '8px',
                background: '#1E1E1E',
                marginBottom: '5px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{coil.id}</div>
              <div style={{ color: '#999', fontSize: '10px' }}>
                {coil.status === 'active' ? '🟢 Active' : '⚪ Completed'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Analytics Workspace</h1>
          <p style={{ color: '#999', margin: 0 }}>Advanced Process Analysis</p>
        </div>

        {/* Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '20px'
        }}>
          {/* Trend Viewer */}
          <div style={{
            background: '#2C2C2C',
            borderRadius: '8px',
            padding: '20px',
            gridColumn: 'span 2'
          }}>
            <TrendViewer
              tags={selectedTags}
              timeWindow={600}
              height={400}
              title={`Process Trends (${selectedTags.length} signals)`}
            />
          </div>

          {/* Cross-Width Profile */}
          {activeCoil && (
            <div style={{
              background: '#2C2C2C',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <ProfileChart
                coilId={activeCoil.id}
                height={350}
                targetThickness={activeCoil.targetThickness}
              />
            </div>
          )}

          {/* Coil Statistics */}
          {activeCoil && activeCoil.stats && (
            <div style={{
              background: '#2C2C2C',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Coil Statistics</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px'
              }}>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>Average Thickness</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ECC71' }}>
                    {activeCoil.stats.avgThickness.toFixed(3)} mm
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>Std Deviation</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498DB' }}>
                    {activeCoil.stats.stdThickness.toFixed(3)} mm
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>Min Thickness</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#E74C3C' }}>
                    {activeCoil.stats.minThickness.toFixed(3)} mm
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>Max Thickness</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F39C12' }}>
                    {activeCoil.stats.maxThickness.toFixed(3)} mm
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Export */}
          <div style={{
            background: '#2C2C2C',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Data Export</h3>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '15px' }}>
              Export historical data for selected tags
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                background: '#3498DB',
                border: 'none',
                color: '#FFF',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}>
                Export CSV
              </button>
              <button style={{
                background: '#2ECC71',
                border: 'none',
                color: '#FFF',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}>
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
