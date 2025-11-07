import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { coilsAPI } from '../services/api';

interface ProfileChartProps {
  coilId: string;
  height?: number;
  targetThickness?: number;
}

interface ProfilePoint {
  zone: number;
  position: number;
  thickness: number;
}

export const ProfileChart: React.FC<ProfileChartProps> = ({
  coilId,
  height = 300,
  targetThickness = 2.5
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts>();
  const [profileData, setProfileData] = useState<ProfilePoint[]>([]);

  useEffect(() => {
    // Fetch profile data
    const fetchProfile = async () => {
      try {
        const response = await coilsAPI.getProfile(coilId);
        setProfileData(response.data.profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
    const interval = setInterval(fetchProfile, 5000); // Update every 5s

    return () => clearInterval(interval);
  }, [coilId]);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current, 'dark');

    const option: echarts.EChartsOption = {
      backgroundColor: '#1E1E1E',
      title: {
        text: 'Cross-Width Thickness Profile',
        subtext: `Coil: ${coilId}`,
        textStyle: { color: '#ECECEC', fontSize: 16 },
        subtextStyle: { color: '#999' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          const point = profileData[data.dataIndex];
          if (!point) return '';
          return `Zone ${point.zone}<br/>
                  Position: ${point.position.toFixed(0)} mm<br/>
                  Thickness: ${point.thickness.toFixed(3)} mm`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: profileData.map((_, i) => i),
        name: 'Zone',
        nameLocation: 'middle',
        nameGap: 30,
        axisLine: { lineStyle: { color: '#666' } },
        axisLabel: { color: '#999' }
      },
      yAxis: {
        type: 'value',
        name: 'Thickness (mm)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLine: { lineStyle: { color: '#666' } },
        splitLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#999' }
      },
      visualMap: {
        show: false,
        dimension: 1,
        pieces: [
          { lte: targetThickness - 0.05, color: '#E74C3C' },  // Under target
          { gt: targetThickness - 0.05, lte: targetThickness + 0.05, color: '#2ECC71' },  // In spec
          { gt: targetThickness + 0.05, color: '#F39C12' }   // Over target
        ]
      },
      series: [{
        type: 'bar',
        data: profileData.map(d => d.thickness),
        itemStyle: {
          borderRadius: [2, 2, 0, 0]
        },
        barWidth: '90%'
      }]
    };

    chartInstance.current.setOption(option);

    // Handle window resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [profileData, coilId, targetThickness]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: `${height}px` }}
    />
  );
};
