import { useState, useEffect } from 'react'
import { Search, Calendar, BarChart3 } from 'lucide-react'
import axios from 'axios'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts'

const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:3004/api/v1'

interface Channel {
  id: string
  name: string
}

export default function HistoricalViewer() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState({
    start: new Date(Date.now() - 3600000).toISOString().slice(0, 16),
    end: new Date().toISOString().slice(0, 16),
  })
  const [aggregation, setAggregation] = useState<string>('')

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/io/channels')
      setChannels(response.data.channels.map((ch: any) => ({ id: ch.id, name: ch.name })))
    } catch (error) {
      console.error('Error loading channels:', error)
    }
  }

  const handleQuery = async () => {
    if (selectedChannels.length === 0) return

    setLoading(true)
    try {
      const payload: any = {
        channels: selectedChannels,
        startTime: new Date(timeRange.start).getTime(),
        endTime: new Date(timeRange.end).getTime(),
        limit: 1000,
      }

      if (aggregation) {
        payload.aggregation = {
          function: 'avg',
          interval: aggregation,
        }
      }

      const response = await axios.post(`${ANALYTICS_URL}/analytics/query`, payload)

      // Transform data for Recharts
      const transformedData = transformData(response.data.data)
      setData(transformedData)
    } catch (error) {
      console.error('Query error:', error)
    } finally {
      setLoading(false)
    }
  }

  const transformData = (rawData: any) => {
    const timestamps = new Set<number>()
    Object.values(rawData).forEach((channelData: any) => {
      channelData.forEach((point: any) => timestamps.add(point.timestamp))
    })

    return Array.from(timestamps)
      .sort((a, b) => a - b)
      .map((timestamp) => {
        const point: any = { timestamp }
        Object.keys(rawData).forEach((channelId) => {
          const channelPoint = rawData[channelId].find((p: any) => p.timestamp === timestamp)
          point[channelId] = channelPoint?.value || null
        })
        return point
      })
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    )
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar */}
      <div className="col-span-3 space-y-4">
        {/* Time Range */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar size={16} className="text-blue-400" />
            <h3 className="text-sm font-medium text-white">Time Range</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start</label>
              <input
                type="datetime-local"
                value={timeRange.start}
                onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">End</label>
              <input
                type="datetime-local"
                value={timeRange.end}
                onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Aggregation</label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="">Raw Data</option>
                <option value="1s">1 Second</option>
                <option value="1m">1 Minute</option>
                <option value="1h">1 Hour</option>
              </select>
            </div>
          </div>
        </div>

        {/* Channel Selection */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 size={16} className="text-blue-400" />
            <h3 className="text-sm font-medium text-white">Channels</h3>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {channels.map((channel) => (
              <label key={channel.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedChannels.includes(channel.id)}
                  onChange={() => toggleChannel(channel.id)}
                  className="rounded bg-slate-700 border-slate-600"
                />
                <span className="text-sm text-gray-300">{channel.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleQuery}
          disabled={loading || selectedChannels.length === 0}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
        >
          <Search size={16} />
          <span>{loading ? 'Loading...' : 'Query'}</span>
        </button>
      </div>

      {/* Chart */}
      <div className="col-span-9">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700" style={{ height: '600px' }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                  }}
                  labelFormatter={formatTime}
                />
                <Legend />
                <Brush dataKey="timestamp" height={30} stroke="#3B82F6" />
                {selectedChannels.map((channelId, index) => (
                  <Line
                    key={channelId}
                    type="monotone"
                    dataKey={channelId}
                    stroke={`hsl(${index * 60}, 70%, 50%)`}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select channels and click Query to view historical data
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
