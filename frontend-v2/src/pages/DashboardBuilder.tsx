import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus } from 'lucide-react'
import { useDashboardStore, Widget } from '../store/dashboardStore'
import DashboardGrid from '../components/DashboardGrid'

export default function DashboardBuilder() {
  const navigate = useNavigate()
  const { currentDashboard, setCurrentDashboard, saveDashboard, addWidget } = useDashboardStore()
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [dashboardName, setDashboardName] = useState(currentDashboard?.name || 'New Dashboard')

  const handleSave = async () => {
    if (currentDashboard) {
      await saveDashboard({
        ...currentDashboard,
        name: dashboardName,
      })
      navigate('/dashboard')
    }
  }

  const handleAddWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      x: 0,
      y: 0,
      w: type === 'trend-graph' ? 6 : 3,
      h: type === 'trend-graph' ? 4 : 2,
      config: getDefaultConfig(type),
    }
    addWidget(newWidget)
    setShowAddWidget(false)
  }

  const getDefaultConfig = (type: Widget['type']) => {
    switch (type) {
      case 'value-card':
        return { title: 'Value', channel: '', units: '', decimals: 2 }
      case 'trend-graph':
        return { title: 'Trend', channels: [], timeWindow: 600 }
      case 'progress-bar':
        return { title: 'Progress', channel: '', min: 0, max: 100 }
      case 'alarm-log':
        return { title: 'Alarms', maxItems: 10 }
      default:
        return {}
    }
  }

  if (!currentDashboard) {
    setCurrentDashboard({
      id: '',
      name: 'New Dashboard',
      widgets: [],
    })
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-700 rounded-md"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <input
              type="text"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="text-xl font-bold bg-transparent text-white border-none focus:outline-none"
              placeholder="Dashboard Name"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddWidget(!showAddWidget)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
            >
              <Plus size={16} />
              <span>Add Widget</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Widget Selector */}
        {showAddWidget && (
          <div className="px-4 py-3 bg-slate-700 border-t border-slate-600">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleAddWidget('value-card')}
                className="p-3 bg-slate-600 hover:bg-slate-500 rounded-md text-white text-sm"
              >
                Value Card
              </button>
              <button
                onClick={() => handleAddWidget('trend-graph')}
                className="p-3 bg-slate-600 hover:bg-slate-500 rounded-md text-white text-sm"
              >
                Trend Graph
              </button>
              <button
                onClick={() => handleAddWidget('progress-bar')}
                className="p-3 bg-slate-600 hover:bg-slate-500 rounded-md text-white text-sm"
              >
                Progress Bar
              </button>
              <button
                onClick={() => handleAddWidget('alarm-log')}
                className="p-3 bg-slate-600 hover:bg-slate-500 rounded-md text-white text-sm"
              >
                Alarm Log
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Dashboard Content */}
      <main className="p-4">
        {currentDashboard && (
          <DashboardGrid dashboard={currentDashboard} editable={true} />
        )}
      </main>
    </div>
  )
}
