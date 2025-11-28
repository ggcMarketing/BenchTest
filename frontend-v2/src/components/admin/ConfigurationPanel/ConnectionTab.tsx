import { useState, useEffect } from 'react'
import { Save, AlertCircle, CheckCircle, Loader, Wifi } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Props {
  module: any
  onUpdate: () => void
}

export default function ConnectionTab({ module, onUpdate }: Props) {
  const [config, setConfig] = useState<any>({
    host: '',
    port: 502,
    timeout: 5000,
    ...module.config
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    latency?: number
  } | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setConfig({
      host: '',
      port: 502,
      timeout: 5000,
      ...module.config
    })
  }, [module])

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    setError('')

    try {
      const response = await axios.post(
        `${API_URL}/api/v1/connections/${module.id}/test`,
        config
      )
      
      setTestResult({
        success: true,
        message: response.data.message || 'Connection successful',
        latency: response.data.latency_ms
      })
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.error || 'Connection failed'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      await axios.put(`${API_URL}/api/v1/connections/${module.id}`, {
        ...module,
        config
      })
      
      setSuccess(true)
      onUpdate()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const protocol = module.protocol || 'modbus'

  return (
    <div className="p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Connection Settings</h3>
            <p className="text-sm text-gray-400 mt-1">
              Configure how ParX establishes communication to the device
            </p>
          </div>
          
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
          >
            {testing ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Wifi size={16} />
                <span>Test Connection</span>
              </>
            )}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`flex items-center space-x-2 p-3 border rounded ${
            testResult.success
              ? 'bg-green-500/10 border-green-500/50 text-green-400'
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}>
            {testResult.success ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <div className="flex-1">
              <span className="text-sm font-medium">{testResult.message}</span>
              {testResult.latency && (
                <span className="text-xs ml-2">({testResult.latency}ms)</span>
              )}
            </div>
          </div>
        )}

        {/* Universal Connection Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Endpoint / IP Address *
              </label>
              <input
                type="text"
                value={config.host || ''}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="192.168.1.100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Port *
              </label>
              <input
                type="number"
                value={config.port || 502}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                min="1"
                max="65535"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={config.timeout || 5000}
              onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              min="1000"
              max="60000"
              step="1000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Connection timeout (1-60 seconds)
            </p>
          </div>
        </div>

        {/* Protocol-Specific Fields */}
        {protocol === 'modbus' && (
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Modbus TCP Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Unit ID (Slave ID)
                </label>
                <input
                  type="number"
                  value={config.unitId || 1}
                  onChange={(e) => setConfig({ ...config, unitId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  min="1"
                  max="247"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Byte Order
                </label>
                <select
                  value={config.byteOrder || 'big-endian'}
                  onChange={(e) => setConfig({ ...config, byteOrder: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="big-endian">Big Endian (ABCD)</option>
                  <option value="little-endian">Little Endian (DCBA)</option>
                  <option value="big-endian-swap">Big Endian Byte Swap (BADC)</option>
                  <option value="little-endian-swap">Little Endian Byte Swap (CDAB)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {protocol === 'opcua' && (
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
            <h4 className="text-sm font-medium text-gray-300 mb-3">OPC UA Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Security Policy
                </label>
                <select
                  value={config.securityPolicy || 'None'}
                  onChange={(e) => setConfig({ ...config, securityPolicy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="None">None</option>
                  <option value="Basic128Rsa15">Basic128Rsa15</option>
                  <option value="Basic256">Basic256</option>
                  <option value="Basic256Sha256">Basic256Sha256</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Message Security Mode
                </label>
                <select
                  value={config.securityMode || 'None'}
                  onChange={(e) => setConfig({ ...config, securityMode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                >
                  <option value="None">None</option>
                  <option value="Sign">Sign</option>
                  <option value="SignAndEncrypt">Sign and Encrypt</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={config.username || ''}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={config.password || ''}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {protocol === 'mqtt' && (
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
            <h4 className="text-sm font-medium text-gray-300 mb-3">MQTT Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={config.clientId || ''}
                  onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  placeholder="parx-client-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={config.username || ''}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={config.password || ''}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.useTLS || false}
                    onChange={(e) => setConfig({ ...config, useTLS: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500"
                  />
                  <span className="text-sm text-gray-400">Use TLS/SSL</span>
                </label>
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
