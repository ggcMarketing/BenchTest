import { useState, useEffect } from 'react'
import { Activity, Database, Wifi, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import axios from 'axios'

const SERVICES = [
  { name: 'Admin API', url: 'http://localhost:3000/health', port: 3000 },
  { name: 'Data Router', url: 'http://localhost:3001/health', port: 3001 },
  { name: 'Collector', url: 'http://localhost:3002/health', port: 3002 },
  { name: 'Storage Engine', url: 'http://localhost:3003/health', port: 3003 },
  { name: 'Analytics Engine', url: 'http://localhost:3004/health', port: 3004 },
]

interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  uptime?: number
  memory?: number
  connections?: number
  lastCheck: Date
}

export default function SystemMonitoring() {
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const checkHealth = async () => {
    const results = await Promise.all(
      SERVICES.map(async (service) => {
        try {
          const response = await axios.get(service.url, { timeout: 5000 })
          return {
            name: service.name,
            status: response.data.status === 'ok' ? 'healthy' : 'unhealthy',
            uptime: response.data.uptime,
            memory: response.data.memory,
            connections: response.data.connections,
            lastCheck: new Date(),
          } as ServiceHealth
        } catch (error) {
          return {
            name: service.name,
            status: 'unhealthy',
            lastCheck: new Date(),
          } as ServiceHealth
        }
      })
    )
    setServices(results)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={20} className="text-green-400" />
      case 'unhealthy':
        return <AlertCircle size={20} className="text-red-400" />
      default:
        return <Clock size={20} className="text-gray-400" />
    }
  }

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatMemory = (bytes?: number) => {
    if (!bytes) return 'N/A'
    return `${(bytes / 1024 / 1024).toFixed(0)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Checking service health...</div>
      </div>
    )
  }

  const healthyCount = services.filter((s) => s.status === 'healthy').length
  const totalCount = services.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">System Monitoring</h2>
        <div className="flex items-center space-x-2">
          <Activity size={20} className="text-blue-400" />
          <span className="text-white font-medium">
            {healthyCount}/{totalCount} Services Healthy
          </span>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium mb-1">System Status</h3>
            <p className="text-sm text-gray-400">
              Last checked: {services[0]?.lastCheck.toLocaleTimeString()}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              healthyCount === totalCount
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {healthyCount === totalCount ? 'All Systems Operational' : 'Service Issues Detected'}
          </div>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.name}
            className={`bg-slate-800 rounded-lg p-4 border ${
              service.status === 'healthy' ? 'border-green-500/30' : 'border-red-500/30'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(service.status)}
                <h3 className="text-white font-medium">{service.name}</h3>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span
                  className={
                    service.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                  }
                >
                  {service.status === 'healthy' ? 'Online' : 'Offline'}
                </span>
              </div>

              {service.uptime !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime:</span>
                  <span className="text-white">{formatUptime(service.uptime)}</span>
                </div>
              )}

              {service.memory !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory:</span>
                  <span className="text-white">{formatMemory(service.memory)}</span>
                </div>
              )}

              {service.connections !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Connections:</span>
                  <span className="text-white">{service.connections}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Infrastructure Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center space-x-3 mb-2">
            <Database size={20} className="text-blue-400" />
            <h3 className="text-white font-medium">PostgreSQL</h3>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Port:</span>
              <span className="text-white">5432</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center space-x-3 mb-2">
            <Database size={20} className="text-orange-400" />
            <h3 className="text-white font-medium">Redis</h3>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Port:</span>
              <span className="text-white">6379</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center space-x-3 mb-2">
            <Wifi size={20} className="text-purple-400" />
            <h3 className="text-white font-medium">WebSocket</h3>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Port:</span>
              <span className="text-white">3001</span>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={checkHealth}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
        >
          Refresh Status
        </button>
      </div>
    </div>
  )
}
