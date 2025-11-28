import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Plus, Wifi, WifiOff } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Props {
  onSelect: (module: any, type: 'interface' | 'connection' | 'channel') => void
  selectedId?: string
}

export default function ModuleTree({ onSelect, selectedId }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['inputs']))
  const [expandedInterfaces, setExpandedInterfaces] = useState<Set<string>>(new Set())
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set())
  const [interfaces, setInterfaces] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [interfacesRes, connectionsRes, channelsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/interfaces`),
        axios.get(`${API_URL}/api/v1/connections`),
        axios.get(`${API_URL}/api/v1/channels`)
      ])
      
      setInterfaces(interfacesRes.data)
      setConnections(connectionsRes.data)
      setChannels(channelsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleInterface = (interfaceId: string) => {
    const newExpanded = new Set(expandedInterfaces)
    if (newExpanded.has(interfaceId)) {
      newExpanded.delete(interfaceId)
    } else {
      newExpanded.add(interfaceId)
    }
    setExpandedInterfaces(newExpanded)
  }

  const toggleConnection = (connectionId: string) => {
    const newExpanded = new Set(expandedConnections)
    if (newExpanded.has(connectionId)) {
      newExpanded.delete(connectionId)
    } else {
      newExpanded.add(connectionId)
    }
    setExpandedConnections(newExpanded)
  }

  const getProtocolIcon = (protocol: string) => {
    const icons: Record<string, string> = {
      'modbus': '🔌',
      'opcua': '🏭',
      'mqtt': '📡',
      'ethernet-ip': '🌐',
      'egd': '📊'
    }
    return icons[protocol] || '📡'
  }

  const getConnectionsForInterface = (interfaceId: string) => {
    return connections.filter(c => c.interface_id === interfaceId)
  }

  const getChannelsForConnection = (connectionId: string) => {
    return channels.filter(c => c.connection_id === connectionId)
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        Loading modules...
      </div>
    )
  }

  return (
    <div className="text-sm">
      {/* Inputs Category */}
      <div>
        <button
          onClick={() => toggleCategory('inputs')}
          className="w-full flex items-center px-4 py-2 hover:bg-slate-800 text-left"
        >
          {expandedCategories.has('inputs') ? (
            <ChevronDown size={16} className="text-gray-400 mr-2" />
          ) : (
            <ChevronRight size={16} className="text-gray-400 mr-2" />
          )}
          <span className="font-semibold text-white">Inputs</span>
          <span className="ml-auto text-xs text-gray-500">{interfaces.length}</span>
        </button>

        {expandedCategories.has('inputs') && (
          <div className="ml-2">
            {/* Group by protocol */}
            {['modbus', 'opcua', 'mqtt', 'ethernet-ip', 'egd'].map(protocol => {
              const protocolInterfaces = interfaces.filter(i => i.protocol === protocol)
              if (protocolInterfaces.length === 0) return null

              return (
                <div key={protocol}>
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                    {getProtocolIcon(protocol)} {protocol === 'opcua' ? 'OPC UA' : protocol === 'ethernet-ip' ? 'EtherNet/IP' : protocol.toUpperCase()}
                  </div>
                  
                  {protocolInterfaces.map(iface => {
                    const ifaceConnections = getConnectionsForInterface(iface.id)
                    const isExpanded = expandedInterfaces.has(iface.id)
                    const isSelected = selectedId === iface.id

                    return (
                      <div key={iface.id}>
                        <button
                          onClick={() => {
                            toggleInterface(iface.id)
                            onSelect(iface, 'interface')
                          }}
                          className={`w-full flex items-center px-4 py-2 hover:bg-slate-800 text-left ${
                            isSelected ? 'bg-slate-800 border-l-2 border-blue-500' : ''
                          }`}
                        >
                          {ifaceConnections.length > 0 ? (
                            isExpanded ? (
                              <ChevronDown size={14} className="text-gray-400 mr-2" />
                            ) : (
                              <ChevronRight size={14} className="text-gray-400 mr-2" />
                            )
                          ) : (
                            <span className="w-4 mr-2" />
                          )}
                          
                          {iface.enabled ? (
                            <Wifi size={14} className="text-green-400 mr-2" />
                          ) : (
                            <WifiOff size={14} className="text-gray-500 mr-2" />
                          )}
                          
                          <span className={`flex-1 ${iface.enabled ? 'text-white' : 'text-gray-500'}`}>
                            {iface.name}
                          </span>
                          
                          <span className="text-xs text-gray-500">{ifaceConnections.length}</span>
                        </button>

                        {/* Connections */}
                        {isExpanded && ifaceConnections.map(conn => {
                          const connChannels = getChannelsForConnection(conn.id)
                          const isConnExpanded = expandedConnections.has(conn.id)
                          const isConnSelected = selectedId === conn.id

                          return (
                            <div key={conn.id} className="ml-4">
                              <button
                                onClick={() => {
                                  toggleConnection(conn.id)
                                  onSelect(conn, 'connection')
                                }}
                                className={`w-full flex items-center px-4 py-2 hover:bg-slate-800 text-left ${
                                  isConnSelected ? 'bg-slate-800 border-l-2 border-blue-500' : ''
                                }`}
                              >
                                {connChannels.length > 0 ? (
                                  isConnExpanded ? (
                                    <ChevronDown size={14} className="text-gray-400 mr-2" />
                                  ) : (
                                    <ChevronRight size={14} className="text-gray-400 mr-2" />
                                  )
                                ) : (
                                  <span className="w-4 mr-2" />
                                )}
                                
                                {conn.enabled ? (
                                  <Wifi size={14} className="text-green-400 mr-2" />
                                ) : (
                                  <WifiOff size={14} className="text-gray-500 mr-2" />
                                )}
                                
                                <span className={`flex-1 ${conn.enabled ? 'text-white' : 'text-gray-500'}`}>
                                  {conn.name}
                                </span>
                                
                                <span className="text-xs text-gray-500">{connChannels.length}</span>
                              </button>

                              {/* Channels */}
                              {isConnExpanded && connChannels.map(channel => {
                                const isChannelSelected = selectedId === channel.id

                                return (
                                  <button
                                    key={channel.id}
                                    onClick={() => onSelect(channel, 'channel')}
                                    className={`w-full flex items-center px-4 py-2 ml-4 hover:bg-slate-800 text-left ${
                                      isChannelSelected ? 'bg-slate-800 border-l-2 border-blue-500' : ''
                                    }`}
                                  >
                                    <span className="w-4 mr-2" />
                                    
                                    {channel.enabled ? (
                                      <div className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                                    ) : (
                                      <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
                                    )}
                                    
                                    <span className={`flex-1 text-sm ${channel.enabled ? 'text-white' : 'text-gray-500'}`}>
                                      {channel.name}
                                    </span>
                                    
                                    {channel.metadata?.units && (
                                      <span className="text-xs text-gray-500">{channel.metadata.units}</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Add Module Button */}
            <button
              onClick={() => {/* TODO: Open add interface dialog */}}
              className="w-full flex items-center px-4 py-2 mt-2 hover:bg-slate-800 text-blue-400 text-left"
            >
              <Plus size={16} className="mr-2" />
              <span>Add Module</span>
            </button>
          </div>
        )}
      </div>

      {/* Outputs Category (Placeholder) */}
      <div className="mt-2">
        <button
          onClick={() => toggleCategory('outputs')}
          className="w-full flex items-center px-4 py-2 hover:bg-slate-800 text-left"
        >
          {expandedCategories.has('outputs') ? (
            <ChevronDown size={16} className="text-gray-400 mr-2" />
          ) : (
            <ChevronRight size={16} className="text-gray-400 mr-2" />
          )}
          <span className="font-semibold text-white">Outputs</span>
          <span className="ml-auto text-xs text-gray-500">0</span>
        </button>

        {expandedCategories.has('outputs') && (
          <div className="ml-2">
            <button
              onClick={() => {/* TODO: Open add output dialog */}}
              className="w-full flex items-center px-4 py-2 mt-2 hover:bg-slate-800 text-blue-400 text-left"
            >
              <Plus size={16} className="mr-2" />
              <span>Add Module</span>
            </button>
          </div>
        )}
      </div>

      {/* Groups Category (Placeholder) */}
      <div className="mt-2">
        <button
          onClick={() => toggleCategory('groups')}
          className="w-full flex items-center px-4 py-2 hover:bg-slate-800 text-left"
        >
          {expandedCategories.has('groups') ? (
            <ChevronDown size={16} className="text-gray-400 mr-2" />
          ) : (
            <ChevronRight size={16} className="text-gray-400 mr-2" />
          )}
          <span className="font-semibold text-white">Groups</span>
          <span className="ml-auto text-xs text-gray-500">0</span>
        </button>
      </div>

      {/* Analytics Category (Placeholder) */}
      <div className="mt-2">
        <button
          onClick={() => toggleCategory('analytics')}
          className="w-full flex items-center px-4 py-2 hover:bg-slate-800 text-left"
        >
          {expandedCategories.has('analytics') ? (
            <ChevronDown size={16} className="text-gray-400 mr-2" />
          ) : (
            <ChevronRight size={16} className="text-gray-400 mr-2" />
          )}
          <span className="font-semibold text-white">Analytics</span>
          <span className="ml-auto text-xs text-gray-500">0</span>
        </button>
      </div>

      {/* General Category (Placeholder) */}
      <div className="mt-2">
        <button
          onClick={() => toggleCategory('general')}
          className="w-full flex items-center px-4 py-2 hover:bg-slate-800 text-left"
        >
          {expandedCategories.has('general') ? (
            <ChevronDown size={16} className="text-gray-400 mr-2" />
          ) : (
            <ChevronRight size={16} className="text-gray-400 mr-2" />
          )}
          <span className="font-semibold text-white">General</span>
        </button>
      </div>
    </div>
  )
}
