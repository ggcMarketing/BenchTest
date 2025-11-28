import { useEffect, useState } from 'react'
import { X, AlertTriangle, Settings, Save } from 'lucide-react'
import { websocketService } from '../../services/websocket'
import TagSelector from './TagSelector'

interface Props {
  widget: any
  editable: boolean
  onRemove: () => void
  onConfigChange?: (config: any) => void
}

interface Alarm {
  id: string
  channelId: string
  severity: string
  message: string
  timestamp: number
}

export default function AlarmLog({ widget, editable, onRemove, onConfigChange }: Props) {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [showConfig, setShowConfig] = useState(false)
  const [localConfig, setLocalConfig] = useState({
    channels: [],
    maxItems: 10,
    showTimestamp: true,
    ...widget.config
  })

  useEffect(() => {
    const unsubscribe = websocketService.subscribe('alarms', (alarm: any) => {
      // Filter alarms by selected channels if configured
      if (localConfig.channels.length > 0 && !localConfig.channels.includes(alarm.channelId)) {
        return
      }
      setAlarms((prev) => [alarm, ...prev].slice(0, localConfig.maxItems))
    })

    return unsubscribe
  }, [localConfig.maxItems, localConfig.channels])

  const handleSaveConfig = () => {
    if (onConfigChange) {
      onConfigChange(localConfig)
    }
    setShowConfig(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/10'
      case 'WARNING':
        return 'text-yellow-400 bg-yellow-500/10'
      default:
        return 'text-blue-400 bg-blue-500/10'
    }
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

        <div className="text-sm text-gray-400 mb-2 flex items-center">
          <AlertTriangle size={16} className="mr-2" />
          {localConfig.title || 'Alarms'}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {alarms.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No alarms
            </div>
          ) : (
            alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-2 rounded text-sm ${getSeverityColor(alarm.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium">{alarm.severity}</span>
                  {localConfig.showTimestamp && (
                    <span className="text-xs opacity-75">{formatTime(alarm.timestamp)}</span>
                  )}
                </div>
                <div className="text-xs mt-1 opacity-90">{alarm.message}</div>
                <div className="text-xs mt-1 opacity-60">{alarm.channelId}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Configuration Dialog */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Configure Alarm Log</h3>
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
                label="Alarm Sources (Tags)"
              />

              {/* Title */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Widget Title</label>
                <input
                  type="text"
                  value={localConfig.title || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  placeholder="Alarms"
                />
              </div>

              {/* Display Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Items</label>
                  <input
                    type="number"
                    value={localConfig.maxItems}
                    onChange={(e) => setLocalConfig({ ...localConfig, maxItems: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    min="5"
                    max="100"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showTimestamp"
                      checked={localConfig.showTimestamp}
                      onChange={(e) => setLocalConfig({ ...localConfig, showTimestamp: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="showTimestamp" className="text-sm text-gray-400">Show Timestamps</label>
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
