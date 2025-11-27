import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { wsClient, TagData } from '../services/websocketClient';

interface TrendViewerProps {
  tags: string[];
  timeWindow?: number; // seconds
  height?: number;
  title?: string;
}

export const TrendViewer: React.FC<TrendViewerProps> = ({
  tags,
  timeWindow = 300,
  height = 400,
  title = 'Real-Time Process Trends'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts>();
  const [data, setData] = useState<Map<string, { time: number[], values: number[] }>>(
    new Map()
  );

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize ECharts
    chartInstance.current = echarts.init(chartRef.current, 'dark');

    const option: echarts.EChartsOption = {
      backgroundColor: '#1E1E1E',
      title: {
        text: title,
        textStyle: { color: '#ECECEC', fontSize: 16 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: tags,
        textStyle: { color: '#ECECEC' },
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: { backgroundColor: '#1E1E1E' },
          dataZoom: { yAxisIndex: 'none' },
          restore: {}
        }
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#666' } },
        axisLabel: { color: '#999' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#666' } },
        splitLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#999' }
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { start: 0, end: 100, height: 20, bottom: 40 }
      ],
      series: tags.map((tag, idx) => ({
        name: tag.split('/').pop() || tag,
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'lttb',
        lineStyle: { width: 2 },
        data: [],
        color: getColor(idx)
      }))
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
  }, [tags, title]);

  useEffect(() => {
    // Subscribe to tag updates
    const callbacks = tags.map(tag => {
      const callback = (tagData: TagData) => {
        setData(prevData => {
          const newData = new Map(prevData);
          const tagHistory = newData.get(tag) || { time: [], values: [] };

          // Add new point
          tagHistory.time.push(tagData.timestamp);
          tagHistory.values.push(tagData.value);

          // Trim to time window
          const cutoffTime = Date.now() - (timeWindow * 1000);
          const startIdx = tagHistory.time.findIndex(t => t >= cutoffTime);
          if (startIdx > 0) {
            tagHistory.time = tagHistory.time.slice(startIdx);
            tagHistory.values = tagHistory.values.slice(startIdx);
          }

          newData.set(tag, tagHistory);
          return newData;
        });
      };

      wsClient.subscribe(tag, callback);
      return { tag, callback };
    });

    return () => {
      callbacks.forEach(({ tag, callback }) => {
        wsClient.unsubscribe(tag, callback);
      });
    };
  }, [tags, timeWindow]);

  useEffect(() => {
    // Update chart with new data
    if (!chartInstance.current) return;

    const series = tags.map((tag, idx) => {
      const tagHistory = data.get(tag) || { time: [], values: [] };
      return {
        name: tag.split('/').pop() || tag,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: tagHistory.time.map((t, i) => [t, tagHistory.values[i]]),
        color: getColor(idx)
      };
    });

    chartInstance.current.setOption({ series });
  }, [data, tags]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: `${height}px` }}
    />
  );
};

function getColor(index: number): string {
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
  ];
  return colors[index % colors.length];
}
