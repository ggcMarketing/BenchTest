import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Props {
  type: 'interface' | 'connection' | 'channel'
  parentId?: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddModuleDialog({ type, parentId, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<any>({
    name: '',
    protocol: 'modbus',
    enabled: true,
    timebase_ms: 1000,
    config: {},
    metadata: {}
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      let endpoint = ''
      let data: any = { ...formData }

      if (type === 'interface') {
        // Generate ID from name
        data.id = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        endpoint = `${API_URL}/api/v1/io/interfaces`
      } else if (type === 'connection') {
        data.id = `${parentId}.${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        data.interface_id = parentId
        endpoint = `${API_URL}/api/v1/io/connections`
      } else if (type === 'channel') {
        data.id = `${parentId}.${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        data.connection_id = parentId
        data.protocol = 'modbus' // Default protocol, will be inherited from connection
        endpoint = `${API_URL}/api/v1/io/channels`
      }

      await axios.post(endpoint, data)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create module')
    } finally {
      setSaving(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'interface':
        return 'Add Interface'
      case 'connection':
        return 'Add Connection'
      case 'channel':
        return 'Add Channel'
    }
  }

  const getDescription = () => {
    switch (type) {
      case 'interface':
        return 'Create a new protocol interface (e.g., Modbus TCP, OPC UA)'
      case 'connection':
        return 'Create a new device connection'
      case 'channel':
        return 'Create a new data channel (signal)'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
            <p className="text-sm text-gray-400 mt-1">{getDescription()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder={
                type === 'interface' ? 'e.g., Main Modbus Interface' :
                type === 'connection' ? 'e.g., PLC-001' :
                'e.g., Temperature Sensor'
              }
              required
            />
          </div>

          {/* Protocol (for interfaces) */}
          {type === 'interface' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Protocol *
              </label>
              <select
                value={formData.protocol}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="modbus">Modbus TCP</option>
                <option value="opcua">OPC UA</option>
                <option value="mqtt">MQTT</option>
                <option value="ethernet-ip">EtherNet/IP</option>
                <option value="egd">EGD</option>
              </select>
            </div>
          )}

          {/* Connection Settings (for connections) */}
          {type === 'connection' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Host / IP Address *
                  </label>
                  <input
                    type="text"
                    value={formData.config.host || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      config: { ...formData.config, host: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="192.168.1.100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Port *
                  </label>
                  <input
                    type="number"
                    value={formData.config.port || 502}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      config: { ...formData.config, port: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    min="1"
                    max="65535"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Channel Settings (for channels) */}
          {type === 'channel' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Source Address *
                  </label>
                  <input
                    type="text"
                    value={formData.config.register || formData.config.address || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      config: { ...formData.config, register: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="40001"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Register, node ID, or topic
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data Type *
                  </label>
                  <select
                    value={formData.config.dataType || 'float'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      config: { ...formData.config, dataType: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="float">Float (32-bit)</option>
                    <option value="int16">Int16 (16-bit signed)</option>
                    <option value="uint16">UInt16 (16-bit unsigned)</option>
                    <option value="int32">Int32 (32-bit signed)</option>
                    <option value="uint32">UInt32 (32-bit unsigned)</option>
                    <option value="bool">Boolean</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Units
                  </label>
                  <input
                    type="text"
                    value={formData.metadata.units || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      metadata: { ...formData.metadata, units: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="°C, PSI, RPM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gain
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.config.gain || 1.0}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      config: { ...formData.config, gain: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Offset
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.config.offset || 0.0}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      config: { ...formData.config, offset: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scan Rate (ms)
                </label>
                <input
                  type="number"
                  value={formData.config.pollingInterval || 1000}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    config: { ...formData.config, pollingInterval: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  min="100"
                  max="60000"
                  step="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How often to read this channel (100-60000ms)
                </p>
              </div>
            </div>
          )}

          {/* Timebase (for interfaces and connections) */}
          {(type === 'interface' || type === 'connection') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timebase (ms)
              </label>
              <input
                type="number"
                value={formData.timebase_ms}
                onChange={(e) => setFormData({ ...formData, timebase_ms: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                min="100"
                max="60000"
                step="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                ParX read/update frequency (100-60000ms)
              </p>
            </div>
          )}

          {/* Enabled */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
              <div>
                <span className="text-sm font-medium text-gray-300">Enabled</span>
                <p className="text-xs text-gray-500">
                  Module will be active at runtime
                </p>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              <span>{saving ? 'Creating...' : 'Create Module'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
