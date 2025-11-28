import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DashboardBuilder from './pages/DashboardBuilder'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/builder"
        element={isAuthenticated ? <DashboardBuilder /> : <Navigate to="/login" />}
      />
      <Route
        path="/analytics"
        element={isAuthenticated ? <Analytics /> : <Navigate to="/login" />}
      />
      <Route
        path="/admin"
        element={isAuthenticated ? <Admin /> : <Navigate to="/login" />}
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
