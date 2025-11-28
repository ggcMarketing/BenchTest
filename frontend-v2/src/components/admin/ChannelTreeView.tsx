import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, Network, Cable, Radio } from 'lucide-react'
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

export default function ChannelTreeView() {
  const [treeData, setTreeData] = useState<TreeData>({
    interfaces: [],
    connections: [],
    channels: []
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<{type: string, id: string} | null>(null)

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

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  const getConnectionsForInterface = (interfaceId: string) => {
    return treeData.connections.filter(c => c.interface_id === interfaceId)
  }

  const getChannelsForConnection = (connectionId: string) => {
    return treeData.channels.filter(ch => ch.connection_id === connectionId)
  }

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'modbus': return <Cable size={16} className="text-blue-400" />
      case 'opcua': return <Network size={16} className="text-green-400" />
      case 'mqtt': return <Radio size={16} className="text-purple-400" />
      default: return <Network size={16} className="text-gray-400" />
    }
  }

  const handleAddInterface = () => {
    // TODO: Open interface creation dialog
    console.log('Add interface')
  }

  const handleAddConnection = (interfaceId: string) => {
    // TODO: Open connection creation dialog
    console.log('Add connection to', interfaceId)
  }

  const handleAddChannel = (connectionId: string) => {
    // TODO: Open channel creation dialog
    console.log('Add channel to', connectionId)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">I/O Configuration Tree</h2>
        <button
          onClick={handleAddInterface}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
        >
          <Plus size={16} />
          <span>New Interface</span>
        </button>
      </div>

      {/* Tree View */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="space-y-1">
          {treeData.interfaces.map((iface) => {
            const isExpanded = expanded.has(iface.id)
            const connections = getConnectionsForInterface(iface.id)

            return (
              <div key={iface.id} className="space-y-1">
                {/* Interface Level */}
                <div
                  className={`flex items-center space-x-2 px-2 py-2 rounded hover:bg-slate-700 cursor-pointer ${
                    selectedItem?.type === 'interface' && selectedItem?.id === iface.id
                      ? 'bg-slate-700'
                      : ''
                  }`}
                  onClick={() => setSelectedItem({ type: 'interface', id: iface.id })}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(iface.id)
                    }}
                    className="p-0.5 hover:bg-slate-600 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </button>
                  {getProtocolIcon(iface.protocol)}
                  <span className="flex-1 text-white font-medium">{iface.name}</span>
                  <span className="text-xs text-gray-400">{iface.protocol.toUpperCase()}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      iface.enabled ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddConnection(iface.id)
                    }}
                    className="p-1 hover:bg-slate-600 rounded"
                  >
                    <Plus size={14} className="text-gray-400" />
                  </button>
                </div>

                {/* Connections Level */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {connections.map((conn) => {
                      const connExpanded = expanded.has(conn.id)
                      const channels = getChannelsForConnection(conn.id)

                      return (
                        <div key={conn.id} className="space-y-1">
                          <div
                            className={`flex items-center space-x-2 px-2 py-2 rounded hover:bg-slate-700 cursor-pointer ${
                              selectedItem?.type === 'connection' && selectedItem?.id === conn.id
                                ? 'bg-slate-700'
                                : ''
                            }`}
                            onClick={() => setSelectedItem({ type: 'connection', id: conn.id })}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(conn.id)
                              }}
                              className="p-0.5 hover:bg-slate-600 rounded"
                            >
                              {connExpanded ? (
                                <ChevronDown size={16} className="text-gray-400" />
                              ) : (
                                <ChevronRight size={16} className="text-gray-400" />
                              )}
                            </button>
                            <Cable size={14} className="text-gray-400" />
                            <span className="flex-1 text-white">{conn.name}</span>
                            <span className="text-xs text-gray-500">{channels.length} channels</span>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                conn.enabled ? 'bg-green-400' : 'bg-red-400'
                              }`}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddChannel(conn.id)
                              }}
                              className="p-1 hover:bg-slate-600 rounded"
                            >
                              <Plus size={14} className="text-gray-400" />
                            </button>
                          </div>

                          {/* Channels Level */}
                          {connExpanded && (
                            <div className="ml-6 space-y-1">
                              {channels.map((channel) => (
                                <div
                                  key={channel.id}
                                  className={`flex items-center space-x-2 px-2 py-2 rounded hover:bg-slate-700 cursor-pointer ${
                                    selectedItem?.type === 'channel' && selectedItem?.id === channel.id
                                      ? 'bg-slate-700'
                                      : ''
                                  }`}
                                  onClick={() => setSelectedItem({ type: 'channel', id: channel.id })}
                                >
                                  <div className="w-4" /> {/* Spacer for alignment */}
                                  <Radio size={12} className="text-gray-500" />
                                  <span className="flex-1 text-gray-300 text-sm">{channel.name}</span>
                                  {channel.metadata?.units && (
                                    <span className="text-xs text-gray-500">{channel.metadata.units}</span>
                                  )}
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      channel.enabled ? 'bg-green-400' : 'bg-red-400'
                                    }`}
                                  />
                                </div>
                              ))}
                              {channels.length === 0 && (
                                <div className="px-2 py-2 text-sm text-gray-500 italic">
                                  No channels configured
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {connections.length === 0 && (
                      <div className="px-2 py-2 text-sm text-gray-500 italic">
                        No connections configured
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {treeData.interfaces.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No interfaces configured. Click "New Interface" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Details Panel */}
      {selectedItem && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h3 className="text-white font-medium mb-4">
            {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)} Details
          </h3>
          <div className="text-sm text-gray-400">
            ID: {selectedItem.id}
          </div>
          {/* TODO: Add detailed configuration panel */}
        </div>
      )}
    </div>
  )
}
