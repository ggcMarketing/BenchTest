import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Props {
  connection: any
  onUpdate: () => void
}

export default function DigitalInputsTab({ connection }: Props) {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChannels()
  }, [connection.id])

  const loadChannels = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/channels?connection_id=${connection.id}`)
      const digitalChannels = response.data.filter((ch: any) => 
        ch.metadata?.channel_type === 'digital' || ch.config?.dataType === 'bool'
      )
      setChannels(digitalChannels)
    } catch (error) {
      console.error('Error loading channels:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-400">Loading channels...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Digital Inputs</h3>
          <p className="text-sm text-gray-400 mt-1">
            Configure digital signal mappings (boolean values)
          </p>
        </div>
        <button
          onClick={() => {/* TODO: Add digital channel */}}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
        >
          <Plus size={16} />
          <span>Add Channel</span>
        </button>
      </div>

      {/* Table */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source Address</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Active</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {channels.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No digital channels configured. Click "Add Channel" to get started.
                </td>
              </tr>
            ) : (
              channels.map((channel) => (
                <tr key={channel.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm text-white">{channel.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{channel.config?.register || channel.config?.address || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {channel.enabled ? (
                      <div className="inline-block w-2 h-2 rounded-full bg-green-400" />
                    ) : (
                      <div className="inline-block w-2 h-2 rounded-full bg-gray-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {/* TODO: Edit channel */}}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
        <div className="text-sm text-gray-400">
          <p>All true/false states are stored as 1/0 in the time series database.</p>
          <p className="mt-1">Digital changes are stored as events and as part of the continuous time series.</p>
        </div>
      </div>
    </div>
  )
}
