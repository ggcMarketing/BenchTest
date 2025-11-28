import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3000/api/v1'

interface StorageRule {
  id: string
  name: string
  enabled: boolean
  backend: string
  mode: string
  channels: string[]
  config: any
}

export default function StorageConfig() {
  const [rules, setRules] = useState<StorageRule[]>([])
  const [editing, setEditing] = useState<StorageRule | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const response = await axios.get(`${API_URL}/storage/rules`)
      setRules(response.data.rules)
    } catch (error) {
      console.error('Error loading rules:', error)
    }
  }

  const handleSave = async () => {
    if (!editing) return

    try {
      if (editing.id && rules.find((r) => r.id === editing.id)) {
        await axios.put(`${API_URL}/storage/rules/${editing.id}`, editing)
      } else {
        await axios.post(`${API_URL}/storage/rules`, editing)
      }
      await loadRules()
      setEditing(null)
      setShowForm(false)
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return

    try {
      await axios.delete(`${API_URL}/storage/rules/${id}`)
      await loadRules()
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const handleNew = () => {
    setEditing({
      id: `rule-${Date.now()}`,
      name: '',
      enabled: true,
      backend: 'timescaledb',
      mode: 'continuous',
      channels: [],
      config: {},
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Storage Rules</h2>
        <button
          onClick={handleNew}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
        >
          <Plus size={16} />
          <span>New Rule</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-white font-medium">{rule.name}</h3>
                <p className="text-sm text-gray-400">{rule.id}</p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setEditing(rule)
                    setShowForm(true)
                  }}
                  className="p-1 hover:bg-slate-700 rounded"
                >
                  <Edit size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-1 hover:bg-red-500 rounded"
                >
                  <Trash2 size={14} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Backend:</span>
                <span className="text-white">{rule.backend}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mode:</span>
                <span className="text-white">{rule.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Channels:</span>
                <span className="text-white">{rule.channels.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={rule.enabled ? 'text-green-400' : 'text-red-400'}>
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
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
                {rules.find((r) => r.id === editing.id) ? 'Edit' : 'New'} Storage Rule
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
                  <label className="block text-sm text-gray-400 mb-1">Rule ID</label>
                  <input
                    type="text"
                    value={editing.id}
                    onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    disabled={rules.find((r) => r.id === editing.id) !== undefined}
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
                  <label className="block text-sm text-gray-400 mb-1">Backend</label>
                  <select
                    value={editing.backend}
                    onChange={(e) => setEditing({ ...editing, backend: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="timescaledb">TimescaleDB</option>
                    <option value="influxdb">InfluxDB</option>
                    <option value="file">File</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Mode</label>
                  <select
                    value={editing.mode}
                    onChange={(e) => setEditing({ ...editing, mode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="continuous">Continuous</option>
                    <option value="change">Change-based</option>
                    <option value="event">Event-based</option>
                    <option value="trigger">Trigger</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Channels (comma-separated)</label>
                  <input
                    type="text"
                    value={editing.channels.join(', ')}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        channels: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
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
