import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DashboardBuilder from './pages/DashboardBuilder'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'


function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)


  // Debug: Check what Vite is loading from .env
  console.log("ENV DUMP EXACT:", JSON.stringify(import.meta.env, null, 2))
  console.log("ADMIN URL at runtime:", import.meta.env.VITE_ADMIN_API_URL)
  console.log("FULL ENV:", import.meta.env)

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
