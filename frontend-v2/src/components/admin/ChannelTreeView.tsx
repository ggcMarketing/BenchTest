import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, Save, X, Network, Cable, Radio, Wifi, Zap, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3000/api/v1'

interface Interface {
  id: string
  name: string
  protocol: string
  description?: string
  enabled: boolean
  config: any
}

interface Connection {
  id: string
  interface_id: string
  name: string
  description?: string
  enabled: boolean
  config: any
  metadata?: any
}

interface Channel {
  id: string
  interface_id: string
  connection_id: string
  name: string
  protocol: string
  enabled: boolean
  config: any
  metadata?: any
}

interface TreeData {
  interfaces: Interface[]
  connections: Connection[]
  channels: Channel[]
}

type DialogMode = 'interface' | 'connection' | 'channel' | null
type EditItem = Interface | Connection | Channel | null

const PROTOCOL_INFO = {
  modbus: { name: 'Modbus TCP', icon: Cable, color: 'blue', implemented: true },
  opcua: { name: 'OPC UA', icon: Network, color: 'green', implemented: true },
  mqtt: { name: 'MQTT', icon: Radio, color: 'purple', implemented: true },
  'ethernet-ip': { name: 'EtherNet/IP', icon: Zap, color: 'yellow', implemented: false },
  egd: { name: 'EGD', icon: Wifi, color: 'orange', implemented: false }
}

export default function ChannelTreeView() {
  const [treeData, setTreeData] = useState<TreeData>({
    interfaces: [],
    connections: [],
    channels: []
  })
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set())
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [editItem, setEditItem] = useState<EditItem>(null)
  const [parentId, setParentId] = useState<string>('')

  useEffect(() => {
    loadTreeData()
  }, [])

  const loadTreeData = async () => {
    try {
      const [interfacesRes, connectionsRes, channelsRes] = await Promise.all([
        axios.get(`${API_URL}/io/interfaces`),
        axios.get(`${API_URL}/io/connections`),
        axios.get(`${API_URL}/io/channels`)
      ])

      setTreeData({
        interfaces: interfacesRes.data.interfaces || [],
        connections: connectionsRes.data.connections || [],
        channels: channelsRes.data.channels || []
      })
    } catch (error) {
      console.error('Error loading tree data:', error)
    }
  }

  const toggleExpandConnection = (id: string) => {
    const newExpanded = new Set(expandedConnections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedConnections(newExpanded)
  }

  const getConnectionsForInterface = (interfaceId: string) => {
    return treeData.connections.filter(c => c.interface_id === interfaceId)
  }

  const getChannelsForConnection = (connectionId: string) => {
    return treeData.channels.filter(ch => ch.connection_id === connectionId)
  }

  const getProtocolIcon = (protocol: string) => {
    const info = PROTOCOL_INFO[protocol as keyof typeof PROTOCOL_INFO]
    if (!info) return <Network size={16} className="text-gray-400" />
    const Icon = info.icon
    return <Icon size={16} className={`text-${info.color}-400`} />
  }

  // Dialog handlers
  const openInterfaceDialog = (iface?: Interface) => {
    if (iface) {
      setEditItem(iface)
    } else {
      setEditItem({
        id: `if-${Date.now()}`,
        name: '',
        protocol: 'modbus',
        description: '',
        enabled: true,
        config: {}
      })
    }
    setDialogMode('interface')
  }

  const openConnectionDialog = (interfaceId: string, conn?: Connection) => {
    setParentId(interfaceId)
    if (conn) {
      setEditItem(conn)
    } else {
      setEditItem({
        id: `conn-${Date.now()}`,
        interface_id: interfaceId,
        name: '',
        description: '',
        enabled: true,
        config: {},
        metadata: {}
      })
    }
    setDialogMode('connection')
  }

  const openChannelDialog = (connectionId: string, interfaceId: string, channel?: Channel) => {
    setParentId(connectionId)
    if (channel) {
      setEditItem(channel)
    } else {
      const iface = treeData.interfaces.find(i => i.id === interfaceId)
      setEditItem({
        id: `ch-${Date.now()}`,
        interface_id: interfaceId,
        connection_id: connectionId,
        name: '',
        protocol: iface?.protocol || 'modbus',
        enabled: true,
        config: {},
        metadata: {}
      })
    }
    setDialogMode('channel')
  }

  const closeDialog = () => {
    setDialogMode(null)
    setEditItem(null)
    setParentId('')
  }

  // Save handlers
  const saveInterface = async () => {
    if (!editItem) return
    try {
      const isNew = !treeData.interfaces.find(i => i.id === editItem.id)
      if (isNew) {
        await axios.post(`${API_URL}/io/interfaces`, editItem)
      } else {
        await axios.put(`${API_URL}/io/interfaces/${editItem.id}`, editItem)
      }
      await loadTreeData()
      closeDialog()
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  const saveConnection = async () => {
    if (!editItem) return
    try {
      const isNew = !treeData.connections.find(c => c.id === editItem.id)
      if (isNew) {
        await axios.post(`${API_URL}/io/connections`, editItem)
      } else {
        await axios.put(`${API_URL}/io/connections/${editItem.id}`, editItem)
      }
      await loadTreeData()
      closeDialog()
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  const saveChannel = async () => {
    if (!editItem) return
    try {
      const isNew = !treeData.channels.find(c => c.id === editItem.id)
      if (isNew) {
        await axios.post(`${API_URL}/io/channels`, editItem)
      } else {
        await axios.put(`${API_URL}/io/channels/${editItem.id}`, editItem)
      }
      await loadTreeData()
      closeDialog()
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  // Delete handlers
  const deleteInterface = async (id: string) => {
    if (!confirm('Delete this interface? This will also delete all connections and channels.')) return
    try {
      await axios.delete(`${API_URL}/io/interfaces/${id}`)
      await loadTreeData()
    } catch (error) {
      console.error('Error deleting interface:', error)
    }
  }

  const deleteConnection = async (id: string) => {
    if (!confirm('Delete this connection? This will also delete all channels.')) return
    try {
      await axios.delete(`${API_URL}/io/connections/${id}`)
      await loadTreeData()
    } catch (error) {
      console.error('Error deleting connection:', error)
    }
  }

  const deleteChannel = async (id: string) => {
    if (!confirm('Delete this channel?')) return
    try {
      await axios.delete(`${API_URL}/io/channels/${id}`)
      await loadTreeData()
    } catch (error) {
      console.error('Error deleting channel:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">I/O Configuration</h2>
        <button
          onClick={() => openInterfaceDialog()}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
        >
          <Plus size={16} />
          <span>New Interface</span>
        </button>
      </div>

      {/* Tree View - Interfaces always visible */}
      <div className="space-y-3">
        {treeData.interfaces.map((iface) => {
          const connections = getConnectionsForInterface(iface.id)
          const protocolInfo = PROTOCOL_INFO[iface.protocol as keyof typeof PROTOCOL_INFO]

          return (
            <div key={iface.id} className="bg-slate-800 rounded-lg border border-slate-700">
              {/* Interface Level - Always Visible */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center space-x-3">
                  {getProtocolIcon(iface.protocol)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-medium">{iface.name}</h3>
                      {!protocolInfo?.implemented && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{protocolInfo?.name || iface.protocol}</p>
                    {iface.description && (
                      <p className="text-xs text-gray-500 mt-1">{iface.description}</p>
                    )}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${iface.enabled ? 'bg-green-400' : 'bg-red-400'}`} />
                  <button
                    onClick={() => openInterfaceDialog(iface)}
                    className="p-2 hover:bg-slate-700 rounded"
                    title="Edit Interface"
                  >
                    <Edit size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => deleteInterface(iface.id)}
                    className="p-2 hover:bg-red-500/20 rounded"
                    title="Delete Interface"
                  >
                    <Trash2 size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Connections List */}
              <div className="p-4 space-y-2">
                {connections.map((conn) => {
                  const isExpanded = expandedConnections.has(conn.id)
                  const channels = getChannelsForConnection(conn.id)

                  return (
                    <div key={conn.id} className="bg-slate-700/50 rounded-lg">
                      {/* Connection Level */}
                      <div className="p-3 flex items-center space-x-2">
                        <button
                          onClick={() => toggleExpandConnection(conn.id)}
                          className="p-0.5 hover:bg-slate-600 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400" />
                          )}
                        </button>
                        <Cable size={14} className="text-gray-400" />
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{conn.name}</div>
                          {conn.description && (
                            <div className="text-xs text-gray-500">{conn.description}</div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{channels.length} channels</span>
                        <div className={`w-2 h-2 rounded-full ${conn.enabled ? 'bg-green-400' : 'bg-red-400'}`} />
                        <button
                          onClick={() => openConnectionDialog(iface.id, conn)}
                          className="p-1 hover:bg-slate-600 rounded"
                          title="Edit Connection"
                        >
                          <Edit size={14} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => deleteConnection(conn.id)}
                          className="p-1 hover:bg-red-500/20 rounded"
                          title="Delete Connection"
                        >
                          <Trash2 size={14} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => openChannelDialog(conn.id, iface.id)}
                          className="p-1 hover:bg-green-500/20 rounded"
                          title="Add Channel"
                        >
                          <Plus size={14} className="text-green-400" />
                        </button>
                      </div>

                      {/* Channels List */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-1">
                          {channels.map((channel) => (
                            <div
                              key={channel.id}
                              className="flex items-center space-x-2 px-3 py-2 bg-slate-800 rounded hover:bg-slate-700"
                            >
                              <Radio size={12} className="text-gray-500" />
                              <div className="flex-1">
                                <div className="text-gray-300 text-sm">{channel.name}</div>
                                <div className="text-xs text-gray-500">{channel.id}</div>
                              </div>
                              {channel.metadata?.units && (
                                <span className="text-xs text-gray-500">{channel.metadata.units}</span>
                              )}
                              <div className={`w-2 h-2 rounded-full ${channel.enabled ? 'bg-green-400' : 'bg-red-400'}`} />
                              <button
                                onClick={() => openChannelDialog(conn.id, iface.id, channel)}
                                className="p-1 hover:bg-slate-600 rounded"
                                title="Edit Channel"
                              >
                                <Edit size={12} className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => deleteChannel(channel.id)}
                                className="p-1 hover:bg-red-500/20 rounded"
                                title="Delete Channel"
                              >
                                <Trash2 size={12} className="text-gray-400" />
                              </button>
                            </div>
                          ))}
                          {channels.length === 0 && (
                            <div className="text-center py-2 text-sm text-gray-500 italic">
                              No channels configured
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Add Connection Button */}
                <button
                  onClick={() => openConnectionDialog(iface.id)}
                  disabled={!protocolInfo?.implemented}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed rounded-lg text-sm ${
                    protocolInfo?.implemented
                      ? 'border-slate-600 text-gray-400 hover:border-slate-500 hover:text-gray-300'
                      : 'border-slate-700 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Plus size={16} />
                  <span>Add Connection</span>
                  {!protocolInfo?.implemented && (
                    <AlertCircle size={14} className="text-yellow-500" />
                  )}
                </button>
              </div>
            </div>
          )
        })}

        {treeData.interfaces.length === 0 && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <Network size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-4">No interfaces configured</p>
            <button
              onClick={() => openInterfaceDialog()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
            >
              Create Your First Interface
            </button>
          </div>
        )}
      </div>

      {/* Interface Dialog */}
      {dialogMode === 'interface' && editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {treeData.interfaces.find(i => i.id === editItem.id) ? 'Edit' : 'New'} Interface
              </h2>
              <button onClick={closeDialog} className="p-1 hover:bg-slate-700 rounded">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Interface ID</label>
                  <input
                    type="text"
                    value={editItem.id}
                    onChange={(e) => setEditItem({ ...editItem, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    disabled={treeData.interfaces.find(i => i.id === editItem.id) !== undefined}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="e.g., Main Modbus Interface"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Protocol</label>
                  <select
                    value={editItem.protocol}
                    onChange={(e) => setEditItem({ ...editItem, protocol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="modbus">Modbus TCP</option>
                    <option value="opcua">OPC UA</option>
                    <option value="mqtt">MQTT</option>
                    <option value="ethernet-ip">EtherNet/IP (Coming Soon)</option>
                    <option value="egd">EGD (Coming Soon)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={editItem.enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditItem({ ...editItem, enabled: e.target.value === 'enabled' })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={editItem.description || ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Configuration (JSON)</label>
                <textarea
                  value={JSON.stringify(editItem.config, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditItem({ ...editItem, config: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono"
                  rows={6}
                  placeholder='{"timeout": 5000, "retries": 3}'
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={saveInterface}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <Save size={16} />
                <span>Save Interface</span>
              </button>
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Dialog */}
      {dialogMode === 'connection' && editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {treeData.connections.find(c => c.id === editItem.id) ? 'Edit' : 'New'} Connection
              </h2>
              <button onClick={closeDialog} className="p-1 hover:bg-slate-700 rounded">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Connection ID</label>
                  <input
                    type="text"
                    value={editItem.id}
                    onChange={(e) => setEditItem({ ...editItem, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    disabled={treeData.connections.find(c => c.id === editItem.id) !== undefined}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="e.g., PLC-001"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={editItem.enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditItem({ ...editItem, enabled: e.target.value === 'enabled' })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={editItem.description || ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Configuration (JSON)</label>
                <textarea
                  value={JSON.stringify(editItem.config, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditItem({ ...editItem, config: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono"
                  rows={6}
                  placeholder='{"host": "192.168.1.100", "port": 502, "unitId": 1}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Connection-specific settings (IP address, port, device ID, etc.)
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Metadata (JSON)</label>
                <textarea
                  value={JSON.stringify(editItem.metadata || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditItem({ ...editItem, metadata: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono"
                  rows={4}
                  placeholder='{"location": "Building A", "manufacturer": "Siemens"}'
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={saveConnection}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <Save size={16} />
                <span>Save Connection</span>
              </button>
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channel Dialog */}
      {dialogMode === 'channel' && editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {treeData.channels.find(c => c.id === editItem.id) ? 'Edit' : 'New'} Channel
              </h2>
              <button onClick={closeDialog} className="p-1 hover:bg-slate-700 rounded">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Channel ID</label>
                  <input
                    type="text"
                    value={editItem.id}
                    onChange={(e) => setEditItem({ ...editItem, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    disabled={treeData.channels.find(c => c.id === editItem.id) !== undefined}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="e.g., Temperature Sensor 1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Protocol</label>
                  <input
                    type="text"
                    value={editItem.protocol}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-gray-500 text-sm"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={editItem.enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditItem({ ...editItem, enabled: e.target.value === 'enabled' })}
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
                  value={JSON.stringify(editItem.config, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditItem({ ...editItem, config: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono"
                  rows={8}
                  placeholder='{"address": 40001, "dataType": "float", "scanRate": 1000}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Channel-specific settings (register address, data type, scan rate, etc.)
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Metadata (JSON)</label>
                <textarea
                  value={JSON.stringify(editItem.metadata || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditItem({ ...editItem, metadata: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono"
                  rows={6}
                  placeholder='{"units": "°C", "min": 0, "max": 100, "description": "Reactor temperature"}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Engineering units, scaling, limits, descriptions, etc.
                </p>
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={saveChannel}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <Save size={16} />
                <span>Save Channel</span>
              </button>
              <button
                onClick={closeDialog}
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
