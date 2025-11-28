import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3000/api/v1'

interface Channel {
  id: string
  name: string
  protocol: string
  enabled: boolean
  config: any
  metadata?: any
}

export default function ChannelConfig() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [editing, setEditing] = useState<Channel | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      const response = await axios.get(`${API_URL}/io/channels`)
      setChannels(response.data.channels)
    } catch (error) {
      console.error('Error loading channels:', error)
    }
  }

  const handleSave = async () => {
    if (!editing) return

    try {
      if (editing.id && channels.find((c) => c.id === editing.id)) {
        await axios.put(`${API_URL}/io/channels/${editing.id}`, editing)
      } else {
        await axios.post(`${API_URL}/io/channels`, editing)
      }
      await loadChannels()
      setEditing(null)
      setShowForm(false)
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this channel?')) return

    try {
      await axios.delete(`${API_URL}/io/channels/${id}`)
      await loadChannels()
    } catch (error) {
      console.error('Error deleting channel:', error)
    }
  }

  const handleNew = () => {
    setEditing({
      id: `ch-${Date.now()}`,
      name: '',
      protocol: 'modbus',
      enabled: true,
      config: {},
      metadata: {},
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">I/O Channels</h2>
        <button
          onClick={handleNew}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
        >
          <Plus size={16} />
          <span>New Channel</span>
        </button>
      </div>

      {/* Channel List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-white font-medium">{channel.name}</h3>
                <p className="text-sm text-gray-400">{channel.id}</p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setEditing(channel)
                    setShowForm(true)
                  }}
                  className="p-1 hover:bg-slate-700 rounded"
                >
                  <Edit size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={() => handleDelete(channel.id)}
                  className="p-1 hover:bg-red-500 rounded"
                >
                  <Trash2 size={14} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Protocol:</span>
                <span className="text-white">{channel.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={channel.enabled ? 'text-green-400' : 'text-red-400'}>
                  {channel.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {channel.metadata?.units && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Units:</span>
                  <span className="text-white">{channel.metadata.units}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Form */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {channels.find((c) => c.id === editing.id) ? 'Edit' : 'New'} Channel
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Channel ID</label>
                  <input
                    type="text"
                    value={editing.id}
                    onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    disabled={channels.find((c) => c.id === editing.id) !== undefined}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Protocol</label>
                  <select
                    value={editing.protocol}
                    onChange={(e) => setEditing({ ...editing, protocol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="modbus">Modbus TCP</option>
                    <option value="opcua">OPC UA</option>
                    <option value="mqtt">MQTT</option>
                    <option value="ethernet-ip">EtherNet/IP</option>
                    <option value="egd">EGD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={editing.enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditing({ ...editing, enabled: e.target.value === 'enabled' })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Configuration (JSON)</label>
                <textarea
                  value={JSON.stringify(editing.config, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditing({ ...editing, config: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono"
                  rows={8}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Metadata (JSON)</label>
                <textarea
                  value={JSON.stringify(editing.metadata || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditing({ ...editing, metadata: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <Save size={16} />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
