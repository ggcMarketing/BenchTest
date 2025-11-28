import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, TrendingUp } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import HistoricalViewer from '../components/analytics/HistoricalViewer'
import DerivedSignalBuilder from '../components/analytics/DerivedSignalBuilder'
import ExportDialog from '../components/analytics/ExportDialog'

type Tab = 'historical' | 'derived' | 'batches'

export default function Analytics() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('historical')
  const [showExport, setShowExport] = useState(false)

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
            <div className="flex items-center space-x-2">
              <TrendingUp size={24} className="text-blue-400" />
              <h1 className="text-xl font-bold text-white">Analytics Workspace</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              {user?.name} ({user?.role})
            </span>
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex space-x-1 border-t border-slate-700">
          <button
            onClick={() => setActiveTab('historical')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'historical'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Historical Viewer
          </button>
          <button
            onClick={() => setActiveTab('derived')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'derived'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Derived Signals
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'batches'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Batch Navigation
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {activeTab === 'historical' && <HistoricalViewer />}
        {activeTab === 'derived' && <DerivedSignalBuilder />}
        {activeTab === 'batches' && (
          <div className="text-center text-gray-400 py-12">
            Batch navigation coming soon...
          </div>
        )}
      </main>

      {/* Export Dialog */}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </div>
  )
}
