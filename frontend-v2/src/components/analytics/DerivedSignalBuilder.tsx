import { useState, useEffect } from 'react'
import { Plus, Trash2, Play, Save } from 'lucide-react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:3004/api/v1'

interface DerivedSignal {
  id?: string
  name: string
  formula: string
  units: string
  description: string
  sourceChannels: string[]
}

export default function DerivedSignalBuilder() {
  const [signals, setSignals] = useState<DerivedSignal[]>([])
  const [editingSignal, setEditingSignal] = useState<DerivedSignal>({
    name: '',
    formula: '',
    units: '',
    description: '',
    sourceChannels: [],
  })
  const [previewData, setPreviewData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSignals()
  }, [])

  const loadSignals = async () => {
    try {
      const response = await axios.get(`${ANALYTICS_URL}/analytics/derived/signals`)
      setSignals(response.data.signals)
    } catch (error) {
      console.error('Error loading signals:', error)
    }
  }

  const handleEvaluate = async () => {
    if (!editingSignal.formula || editingSignal.sourceChannels.length === 0) return

    setLoading(true)
    try {
      const response = await axios.post(`${ANALYTICS_URL}/analytics/derived/evaluate`, {
        formula: editingSignal.formula,
        channels: editingSignal.sourceChannels,
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
      })

      setPreviewData(response.data.data)
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await axios.post(`${ANALYTICS_URL}/analytics/derived/signals`, editingSignal)
      await loadSignals()
      setEditingSignal({
        name: '',
        formula: '',
        units: '',
        description: '',
        sourceChannels: [],
      })
      setPreviewData([])
      alert('Signal saved successfully')
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this signal?')) return

    try {
      await axios.delete(`${ANALYTICS_URL}/analytics/derived/signals/${id}`)
      await loadSignals()
    } catch (error) {
      console.error('Error deleting signal:', error)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Saved Signals */}
      <div className="col-span-3">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-white mb-3">Saved Signals</h3>

          <div className="space-y-2">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="p-3 bg-slate-700 rounded border border-slate-600 hover:border-blue-500 cursor-pointer"
                onClick={() => setEditingSignal(signal)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{signal.name}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">{signal.formula}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(signal.id!)
                    }}
                    className="p-1 hover:bg-red-500 rounded"
                  >
                    <Trash2 size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}

            {signals.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">No saved signals</div>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="col-span-9 space-y-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-white mb-4">Signal Builder</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={editingSignal.name}
                onChange={(e) => setEditingSignal({ ...editingSignal, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                placeholder="Signal name"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Units</label>
              <input
                type="text"
                value={editingSignal.units}
                onChange={(e) => setEditingSignal({ ...editingSignal, units: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                placeholder="e.g., m/min"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={editingSignal.description}
                onChange={(e) => setEditingSignal({ ...editingSignal, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                placeholder="Description"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Source Channels (comma-separated)</label>
              <input
                type="text"
                value={editingSignal.sourceChannels.join(', ')}
                onChange={(e) =>
                  setEditingSignal({
                    ...editingSignal,
                    sourceChannels: e.target.value.split(',').map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                placeholder="ch-001, ch-002"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Formula</label>
              <textarea
                value={editingSignal.formula}
                onChange={(e) => setEditingSignal({ ...editingSignal, formula: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono"
                placeholder="np.mean([ch_001, ch_002])"
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                Available functions: avg, sum, min, max, abs, sqrt, sin, cos, np.*, pd.*
              </div>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm disabled:opacity-50"
            >
              <Play size={16} />
              <span>{loading ? 'Evaluating...' : 'Preview'}</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700" style={{ height: '400px' }}>
          <h3 className="text-sm font-medium text-white mb-4">Preview</h3>

          {previewData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={previewData}>
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
                <Line type="monotone" dataKey="value" stroke="#3B82F6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Click Preview to evaluate the formula
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
