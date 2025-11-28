import { useState, useEffect } from 'react'
import { Save, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Props {
  module: any
  moduleType: 'interface' | 'connection' | 'channel' | null
  onUpdate: () => void
}

export default function GeneralTab({ module, moduleType, onUpdate }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    enabled: true,
    timebase_ms: 1000,
    description: '',
    ...module
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setFormData({
      name: '',
      enabled: true,
      timebase_ms: 1000,
      description: '',
      ...module
    })
  }, [module])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      let endpoint = ''
      if (moduleType === 'interface') {
        endpoint = `${API_URL}/api/v1/interfaces/${module.id}`
      } else if (moduleType === 'connection') {
        endpoint = `${API_URL}/api/v1/connections/${module.id}`
      } else if (moduleType === 'channel') {
        endpoint = `${API_URL}/api/v1/channels/${module.id}`
      }

      await axios.put(endpoint, formData)
      setSuccess(true)
      onUpdate()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Module Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Module Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="e.g., Main PLC, Temperature Sensors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Friendly, human-readable name for this module
          </p>
        </div>

        {/* Module Type (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Module Type
          </label>
          <input
            type="text"
            value={moduleType?.toUpperCase()}
            disabled
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-gray-400 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-filled by ParX based on module category
          </p>
        </div>

        {/* Protocol (for interfaces) */}
        {moduleType === 'interface' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Protocol
            </label>
            <select
              value={formData.protocol || 'modbus'}
              onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="modbus">Modbus TCP</option>
              <option value="opcua">OPC UA</option>
              <option value="mqtt">MQTT</option>
              <option value="ethernet-ip">EtherNet/IP</option>
              <option value="egd">EGD</option>
            </select>
          </div>
        )}

        {/* Enabled */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
            />
            <div>
              <span className="text-sm font-medium text-gray-300">Enabled</span>
              <p className="text-xs text-gray-500">
                Determines if module loads at runtime
              </p>
            </div>
          </label>
        </div>

        {/* Timebase (for interfaces and connections) */}
        {(moduleType === 'interface' || moduleType === 'connection') && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Timebase (ms) *
            </label>
            <input
              type="number"
              value={formData.timebase_ms || 1000}
              onChange={(e) => setFormData({ ...formData, timebase_ms: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              min="100"
              max="60000"
              step="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              ParX read/update frequency (100-60000ms). Determines signal update cadence.
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.metadata?.description || formData.description || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              metadata: { ...formData.metadata, description: e.target.value }
            })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            rows={3}
            placeholder="Optional description for documentation"
          />
        </div>

        {/* Module Layout (for interfaces) */}
        {moduleType === 'interface' && (
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Module Layout</h3>
            <p className="text-xs text-gray-500 mb-4">
              Defines maximum signal count this module will expose to ParX
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Analog Channels
                </label>
                <input
                  type="number"
                  value={formData.max_analog_channels || 100}
                  onChange={(e) => setFormData({ ...formData, max_analog_channels: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  min="0"
                  max="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Digital Channels
                </label>
                <input
                  type="number"
                  value={formData.max_digital_channels || 100}
                  onChange={(e) => setFormData({ ...formData, max_digital_channels: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  min="0"
                  max="1000"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/50 rounded text-green-400 text-sm">
            <Save size={16} />
            <span>Changes saved successfully</span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
