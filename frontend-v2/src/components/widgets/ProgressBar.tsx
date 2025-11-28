import { useEffect, useState } from 'react'
import { X, Settings, Save } from 'lucide-react'
import { websocketService } from '../../services/websocket'
import TagSelector from './TagSelector'

interface Props {
  widget: any
  editable: boolean
  onRemove: () => void
  onConfigChange?: (config: any) => void
}

export default function ProgressBar({ widget, editable, onRemove, onConfigChange }: Props) {
  const [value, setValue] = useState<number>(0)
  const [showConfig, setShowConfig] = useState(false)
  const [localConfig, setLocalConfig] = useState({
    channel: '',
    title: 'Progress',
    min: 0,
    max: 100,
    decimals: 1,
    color: '#3B82F6',
    ...widget.config
  })

  useEffect(() => {
    if (!localConfig.channel) return

    const unsubscribe = websocketService.subscribe(
      localConfig.channel,
      (data) => {
        setValue(data.value)
      }
    )

    return unsubscribe
  }, [localConfig.channel])

  const handleSaveConfig = () => {
    if (onConfigChange) {
      onConfigChange(localConfig)
    }
    setShowConfig(false)
  }

  const min = localConfig.min || 0
  const max = localConfig.max || 100
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  return (
    <>
      <div className="h-full p-4 flex flex-col relative">
        {editable && (
          <div className="absolute top-2 right-2 flex space-x-1">
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
          {localConfig.title}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="w-full bg-slate-700 rounded-full h-8 overflow-hidden">
            <div
              className="h-full transition-all duration-300 flex items-center justify-center"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: localConfig.color
              }}
            >
              <span className="text-white text-sm font-medium">
                {value.toFixed(localConfig.decimals)}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>

        {localConfig.channel && (
          <div className="text-xs text-gray-500 text-center mt-2">
            {localConfig.channel}
          </div>
        )}
      </div>

      {/* Configuration Dialog */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Configure Progress Bar</h3>
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
                selectedTags={localConfig.channel ? [localConfig.channel] : []}
                onChange={(tags) => setLocalConfig({ ...localConfig, channel: tags[0] || '' })}
                multiple={false}
                label="Data Source (Tag)"
              />

              {/* Title */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Widget Title</label>
                <input
                  type="text"
                  value={localConfig.title}
                  onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  placeholder="Progress"
                />
              </div>

              {/* Range Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Minimum Value</label>
                  <input
                    type="number"
                    value={localConfig.min}
                    onChange={(e) => setLocalConfig({ ...localConfig, min: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Maximum Value</label>
                  <input
                    type="number"
                    value={localConfig.max}
                    onChange={(e) => setLocalConfig({ ...localConfig, max: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              </div>

              {/* Display Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Decimal Places</label>
                  <input
                    type="number"
                    value={localConfig.decimals}
                    onChange={(e) => setLocalConfig({ ...localConfig, decimals: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    min="0"
                    max="4"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bar Color</label>
                  <input
                    type="color"
                    value={localConfig.color}
                    onChange={(e) => setLocalConfig({ ...localConfig, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 bg-slate-700 border border-slate-600 rounded cursor-pointer"
                  />
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
