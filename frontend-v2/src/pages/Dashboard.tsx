import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Plus } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDashboardStore } from '../store/dashboardStore'
import { websocketService } from '../services/websocket'
import DashboardGrid from '../components/DashboardGrid'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { dashboards, currentDashboard, loadDashboards, loadDashboard } = useDashboardStore()

  useEffect(() => {
    loadDashboards()
    websocketService.connect()

    return () => {
      websocketService.disconnect()
    }
  }, [])

  useEffect(() => {
    if (dashboards.length > 0 && !currentDashboard) {
      loadDashboard(dashboards[0].id)
    }
  }, [dashboards, currentDashboard])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">ParX Dashboard</h1>
            {currentDashboard && (
              <span className="text-sm text-gray-400">
                {currentDashboard.name}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              {user?.name} ({user?.role})
            </span>
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm"
            >
              <Settings size={16} />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => navigate('/builder')}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
            >
              <Plus size={16} />
              <span>Builder</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="p-4">
        {currentDashboard ? (
          <DashboardGrid dashboard={currentDashboard} editable={false} />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-gray-400 mb-4">No dashboards found</p>
              <button
                onClick={() => navigate('/builder')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Create Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
