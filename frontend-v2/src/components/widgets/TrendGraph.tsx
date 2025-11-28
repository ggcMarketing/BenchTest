import { useEffect, useState } from 'react'
import { X, Settings, Save } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { websocketService } from '../../services/websocket'
import TagSelector from './TagSelector'

interface Props {
  widget: any
  editable: boolean
  onRemove: () => void
  onConfigChange?: (config: any) => void
}

interface DataPoint {
  timestamp: number
  [key: string]: number
}

export default function TrendGraph({ widget, editable, onRemove, onConfigChange }: Props) {
  const [data, setData] = useState<DataPoint[]>([])
  const [showConfig, setShowConfig] = useState(false)
  const [localConfig, setLocalConfig] = useState({
    channels: [],
    maxPoints: 100,
    showGrid: true,
    ...widget.config
  })
  const maxPoints = localConfig.maxPoints

  useEffect(() => {
    const channels = localConfig.channels || []
    if (channels.length === 0) return

    const unsubscribers = channels.map((channel: string) =>
      websocketService.subscribe(channel, (update: any) => {
        setData((prev) => {
          const newData = [
            ...prev,
            {
              timestamp: update.timestamp,
              [channel]: update.value,
            },
          ].slice(-maxPoints)
          return newData
        })
      })
    )

    return () => {
      unsubscribers.forEach((unsub: any) => unsub())
    }
  }, [localConfig.channels, maxPoints])

  const handleSaveConfig = () => {
    if (onConfigChange) {
      onConfigChange(localConfig)
    }
    setShowConfig(false)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <>
      <div className="h-full p-4 flex flex-col relative">
        {editable && (
          <div className="absolute top-2 right-2 flex space-x-1 z-10">
            <button
              onClick={() => setShowConfig(true)}
              className="p-1 bg-slate-700 hover:bg-slate-600 rounded"
              title="Configure"
            >
              <Settings size={16} className="text-gray-400" />
            </button>
            <button
              onClick={onRemove}
              className="p-1 bg-red-500 hover:bg-red-600 rounded"
              title="Remove"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        )}

        <div className="text-sm text-gray-400 mb-2">
          {localConfig.title || 'Trend'}
        </div>

        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              {localConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
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
              {(localConfig.channels || []).map((channel: string, index: number) => (
                <Line
                  key={channel}
                  type="monotone"
                  dataKey={channel}
                  stroke={`hsl(${index * 60}, 70%, 50%)`}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Configuration Dialog */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Configure Trend Graph</h3>
              <button
                onClick={() => setShowConfig(false)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tag Selection */}
              <TagSelector
                selectedTags={localConfig.channels || []}
                onChange={(tags) => setLocalConfig({ ...localConfig, channels: tags })}
                multiple={true}
                label="Data Sources (Tags)"
              />

              {/* Title */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Widget Title</label>
                <input
                  type="text"
                  value={localConfig.title || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  placeholder="Trend"
                />
              </div>

              {/* Display Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Data Points</label>
                  <input
                    type="number"
                    value={localConfig.maxPoints}
                    onChange={(e) => setLocalConfig({ ...localConfig, maxPoints: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    min="10"
                    max="500"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showGrid"
                      checked={localConfig.showGrid}
                      onChange={(e) => setLocalConfig({ ...localConfig, showGrid: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="showGrid" className="text-sm text-gray-400">Show Grid</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={handleSaveConfig}
                className="flex items-center space-x-2 flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                <Save size={16} />
                <span>Save Configuration</span>
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
