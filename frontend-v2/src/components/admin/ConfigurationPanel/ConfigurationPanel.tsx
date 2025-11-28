import { useState } from 'react'
import { Settings, Link, Activity, Zap, BarChart3 } from 'lucide-react'
import GeneralTab from './GeneralTab'
import ConnectionTab from './ConnectionTab'
import AnalogInputsTab from './AnalogInputsTab'
import DigitalInputsTab from './DigitalInputsTab'
import DiagnosticsTab from './DiagnosticsTab'

interface Props {
  module: any
  moduleType: 'interface' | 'connection' | 'channel' | null
  onUpdate: () => void
}

type TabType = 'general' | 'connection' | 'analog' | 'digital' | 'diagnostics'

export default function ConfigurationPanel({ module, moduleType, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('general')

  // Determine which tabs to show based on module type
  const getTabs = () => {
    if (moduleType === 'interface') {
      return [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'diagnostics', label: 'Diagnostics', icon: Activity }
      ]
    } else if (moduleType === 'connection') {
      return [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'connection', label: 'Connection', icon: Link },
        { id: 'analog', label: 'Analog Inputs', icon: BarChart3 },
        { id: 'digital', label: 'Digital Inputs', icon: Zap },
        { id: 'diagnostics', label: 'Diagnostics', icon: Activity }
      ]
    } else if (moduleType === 'channel') {
      return [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'diagnostics', label: 'Diagnostics', icon: Activity }
      ]
    }
    return []
  }

  const tabs = getTabs()

  // Ensure active tab is valid for current module type
  if (!tabs.find(t => t.id === activeTab)) {
    setActiveTab('general')
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab module={module} moduleType={moduleType} onUpdate={onUpdate} />
      case 'connection':
        return <ConnectionTab module={module} onUpdate={onUpdate} />
      case 'analog':
        return <AnalogInputsTab connection={module} onUpdate={onUpdate} />
      case 'digital':
        return <DigitalInputsTab connection={module} onUpdate={onUpdate} />
      case 'diagnostics':
        return <DiagnosticsTab module={module} moduleType={moduleType} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800 px-6 py-4">
        <h2 className="text-xl font-bold text-white">{module.name}</h2>
        <p className="text-sm text-gray-400 mt-1">
          {moduleType === 'interface' && `Interface • ${module.protocol?.toUpperCase()}`}
          {moduleType === 'connection' && `Connection • ${module.id}`}
          {moduleType === 'channel' && `Channel • ${module.metadata?.units || 'No units'}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="flex px-6">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-slate-900">
        {renderTabContent()}
      </div>
    </div>
  )
}
