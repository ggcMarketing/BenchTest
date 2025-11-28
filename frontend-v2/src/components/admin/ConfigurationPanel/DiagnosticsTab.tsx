import { useState, useEffect } from 'react'
import { Activity, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Props {
  module: any
  moduleType: 'interface' | 'connection' | 'channel' | null
}

export default function DiagnosticsTab({ module, moduleType }: Props) {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadDiagnostics()
    
    if (autoRefresh) {
      const interval = setInterval(loadDiagnostics, 1000) // 1 Hz refresh
      return () => clearInterval(interval)
    }
  }, [module.id, autoRefresh])

  const loadDiagnostics = async () => {
    try {
      let endpoint = ''
      if (moduleType === 'connection') {
        endpoint = `${API_URL}/api/v1/connections/${module.id}/diagnostics`
      } else {
        // For interfaces and channels, show basic status
        endpoint = `${API_URL}/api/v1/channels?${moduleType}_id=${module.id}`
      }
      
      const response = await axios.get(endpoint)
      setDiagnostics(response.data)
    } catch (error) {
      console.error('Error loading diagnostics:', error)
      setDiagnostics({ error: 'Failed to load diagnostics' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'good':
        return 'text-green-400'
      case 'degraded':
      case 'warning':
        return 'text-yellow-400'
      case 'disconnected':
      case 'error':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'good':
        return <CheckCircle className="text-green-400" />
      case 'degraded':
      case 'warning':
        return <AlertCircle className="text-yellow-400" />
      case 'disconnected':
      case 'error':
        return <AlertCircle className="text-red-400" />
      default:
        return <Activity className="text-gray-400" />
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-400">Loading diagnostics...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Runtime Diagnostics</h3>
          <p className="text-sm text-gray-400 mt-1">
            Real-time connection status and performance metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500"
            />
            <span>Auto-refresh (1 Hz)</span>
          </label>
          
          <button
            onClick={loadDiagnostics}
            className="p-2 hover:bg-slate-800 rounded text-gray-400 hover:text-white"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(diagnostics?.status || 'unknown')}
            <div>
              <div className="text-xs text-gray-400">Connection Status</div>
              <div className={`text-lg font-semibold ${getStatusColor(diagnostics?.status || 'unknown')}`}>
                {diagnostics?.status?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <Clock className="text-blue-400" />
            <div>
              <div className="text-xs text-gray-400">Last Update</div>
              <div className="text-lg font-semibold text-white">
                {diagnostics?.lastSuccess 
                  ? new Date(diagnostics.lastSuccess).toLocaleTimeString()
                  : 'Never'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
            <h4 className="text-sm font-medium text-white">Performance Metrics</h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Error Count</span>
              <span className="text-sm text-white font-mono">{diagnostics?.errorCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Reconnect Attempts</span>
              <span className="text-sm text-white font-mono">{diagnostics?.reconnectAttempts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Packets Received</span>
              <span className="text-sm text-white font-mono">{diagnostics?.packetsRx || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Packets Transmitted</span>
              <span className="text-sm text-white font-mono">{diagnostics?.packetsTx || 0}</span>
            </div>
          </div>
        </div>

        {/* Protocol-Specific Indicators */}
        {diagnostics?.protocolSpecific && (
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
              <h4 className="text-sm font-medium text-white">Protocol-Specific Indicators</h4>
            </div>
            <div className="p-4">
              <pre className="text-xs text-gray-400 font-mono">
                {JSON.stringify(diagnostics.protocolSpecific, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
