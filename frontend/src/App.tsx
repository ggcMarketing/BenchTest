import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { AnalyticsWorkspace } from './pages/AnalyticsWorkspace';
import { Login } from './pages/Login';
import { useAppStore } from './store/appStore';
import { authAPI } from './services/api';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser, selectedLine } = useAppStore();
  const [activeRoute, setActiveRoute] = useState(window.location.pathname);

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: ['operator', 'engineer', 'manager'] },
    { path: '/analytics', label: 'Analytics', icon: '📈', roles: ['engineer', 'manager'] },
  ];

  const visibleNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <div style={{
        background: '#2C2C2C',
        padding: '15px 30px',
        borderBottom: '2px solid #3498DB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{
            color: '#3498DB',
            fontSize: '24px',
            margin: 0,
            fontWeight: 'bold'
          }}>
            ParX
          </h1>
          <div style={{ color: '#999', fontSize: '14px' }}>
            {selectedLine} | Rolling Mill
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {user && (
            <>
              <div style={{ color: '#ECECEC', fontSize: '14px' }}>
                <span style={{ color: '#999' }}>User:</span> {user.name}
                <span style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  background: '#3498DB',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {user.role.toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: '#E74C3C',
                  border: 'none',
                  color: '#FFF',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      {user && (
        <div style={{
          background: '#252525',
          padding: '0 30px',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: '5px'
        }}>
          {visibleNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setActiveRoute(item.path)}
              style={{
                padding: '12px 20px',
                background: activeRoute === item.path ? '#1E1E1E' : 'transparent',
                color: activeRoute === item.path ? '#3498DB' : '#999',
                textDecoration: 'none',
                borderBottom: activeRoute === item.path ? '2px solid #3498DB' : 'none',
                transition: 'all 0.2s',
                fontSize: '14px',
                fontWeight: activeRoute === item.path ? 'bold' : 'normal'
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles
}) => {
  const { user } = useAppStore();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function App() {
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('parx_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    setLoading(false);
  }, [setUser]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1E1E1E',
        color: '#ECECEC'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" />
            ) : (
              <Login onLoginSuccess={() => window.location.href = '/'} />
            )
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['engineer', 'manager']}>
              <Layout>
                <AnalyticsWorkspace />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
