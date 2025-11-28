import { useState } from 'react'
import { X, Download } from 'lucide-react'
import axios from 'axios'

const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:3004/api/v1'

interface Props {
  onClose: () => void
}

export default function ExportDialog({ onClose }: Props) {
  const [channels, setChannels] = useState('')
  const [format, setFormat] = useState('csv')
  const [timeRange, setTimeRange] = useState({
    start: new Date(Date.now() - 3600000).toISOString().slice(0, 16),
    end: new Date().toISOString().slice(0, 16),
  })
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!channels.trim()) {
      alert('Please enter channel IDs')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(
        `${ANALYTICS_URL}/analytics/export`,
        {
          channels: channels.split(',').map((s) => s.trim()),
          startTime: new Date(timeRange.start).getTime(),
          endTime: new Date(timeRange.end).getTime(),
          format,
          filename: `export_${Date.now()}`,
        },
        {
          responseType: 'blob',
        }
      )

      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `export_${Date.now()}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      onClose()
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Export Data</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Channel IDs (comma-separated)</label>
            <input
              type="text"
              value={channels}
              onChange={(e) => setChannels(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              placeholder="ch-001, ch-002"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={timeRange.start}
              onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">End Time</label>
            <input
              type="datetime-local"
              value={timeRange.end}
              onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-2 mt-6">
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
          >
            <Download size={16} />
            <span>{loading ? 'Exporting...' : 'Export'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
