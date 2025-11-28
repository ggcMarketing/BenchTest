import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Database, HardDrive, Users, Activity } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import ChannelTreeView from '../components/admin/ChannelTreeView'
import StorageConfig from '../components/admin/StorageConfig'
import UserManagement from '../components/admin/UserManagement'
import SystemMonitoring from '../components/admin/SystemMonitoring'

type Tab = 'channels' | 'storage' | 'users' | 'monitoring'

export default function Admin() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('monitoring')

  if (user?.role !== 'admin' && user?.role !== 'engineer') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'monitoring' as Tab, label: 'System Monitoring', icon: Activity },
    { id: 'channels' as Tab, label: 'I/O Channels', icon: Database },
    { id: 'storage' as Tab, label: 'Storage Rules', icon: HardDrive },
    { id: 'users' as Tab, label: 'User Management', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-700 rounded-md">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="flex items-center space-x-2">
              <Settings size={24} className="text-blue-400" />
              <h1 className="text-xl font-bold text-white">Administration</h1>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Logged in as: <span className="text-white">{user?.username}</span> ({user?.role})
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      <main className="p-6">
        {activeTab === 'monitoring' && <SystemMonitoring />}
        {activeTab === 'channels' && <ChannelTreeView />}
        {activeTab === 'storage' && <StorageConfig />}
        {activeTab === 'users' && <UserManagement />}
      </main>
    </div>
  )
}
