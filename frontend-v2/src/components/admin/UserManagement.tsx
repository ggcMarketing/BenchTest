import { useState } from 'react'
import { Shield, User, Briefcase } from 'lucide-react'

export default function UserManagement() {
  // Mock users for now - in production this would come from API
  const [users] = useState([
    { id: 1, username: 'admin', name: 'System Administrator', role: 'admin', enabled: true },
    { id: 2, username: 'engineer1', name: 'Engineer One', role: 'engineer', enabled: true },
    { id: 3, username: 'operator1', name: 'Operator One', role: 'operator', enabled: true },
  ])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={20} className="text-red-400" />
      case 'engineer':
        return <Briefcase size={20} className="text-blue-400" />
      default:
        return <User size={20} className="text-green-400" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">User Management</h2>
        <div className="text-sm text-gray-400">
          User management API coming soon...
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start space-x-3">
              <div className="mt-1">{getRoleIcon(user.role)}</div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{user.name}</h3>
                <p className="text-sm text-gray-400">@{user.username}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role:</span>
                    <span className="text-white capitalize">{user.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={user.enabled ? 'text-green-400' : 'text-red-400'}>
                      {user.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          <strong>Note:</strong> Full user management functionality (create, edit, delete users) will be
          implemented in a future update. Currently showing read-only view of existing users.
        </p>
      </div>
    </div>
  )
}
