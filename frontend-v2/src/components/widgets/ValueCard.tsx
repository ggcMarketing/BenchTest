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

export default function ValueCard({ widget, editable, onRemove, onConfigChange }: Props) {
  const [value, setValue] = useState<number | null>(null)
  const [quality, setQuality] = useState('UNKNOWN')
  const [showConfig, setShowConfig] = useState(false)
  const [localConfig, setLocalConfig] = useState({
    channel: '',
    title: 'Value',
    units: '',
    decimals: 2,
    showQuality: true,
    ...widget.config
  })

  useEffect(() => {
    if (!localConfig.channel) return

    const unsubscribe = websocketService.subscribe(
      localConfig.channel,
      (data) => {
        setValue(data.value)
        setQuality(data.quality)
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

  const formatValue = (val: number | null) => {
    if (val === null) return '--'
    return val.toFixed(localConfig.decimals)
  }

  const getQualityColor = () => {
    switch (quality) {
      case 'GOOD':
        return 'text-green-400'
      case 'BAD':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

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

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getQualityColor()}`}>
              {formatValue(value)}
            </div>
            {localConfig.units && (
              <div className="text-sm text-gray-500 mt-1">
                {localConfig.units}
              </div>
            )}
            {localConfig.showQuality && (
              <div className={`text-xs mt-2 ${getQualityColor()}`}>
                {quality}
              </div>
            )}
          </div>
        </div>

        {localConfig.channel && (
          <div className="text-xs text-gray-500 text-center">
            {localConfig.channel}
          </div>
        )}
      </div>

      {/* Configuration Dialog */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Configure Value Card</h3>
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
                  placeholder="Value"
                />
              </div>

              {/* Display Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Engineering Units</label>
                  <input
                    type="text"
                    value={localConfig.units}
                    onChange={(e) => setLocalConfig({ ...localConfig, units: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="°C, PSI, RPM, etc."
                  />
                </div>
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
              </div>

              {/* Display Options */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Display Options</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showQuality"
                    checked={localConfig.showQuality}
                    onChange={(e) => setLocalConfig({ ...localConfig, showQuality: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="showQuality" className="text-sm text-gray-400">Show Quality Indicator</label>
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
