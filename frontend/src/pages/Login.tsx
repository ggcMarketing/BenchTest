import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useAppStore } from '../store/appStore';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      const { user, token } = response.data;

      // Store token and user
      localStorage.setItem('parx_token', token);
      localStorage.setItem('parx_user', JSON.stringify(user));

      // Update store
      setUser(user);

      // Call success callback
      onLoginSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: string) => {
    const credentials = {
      operator: { username: 'operator1', password: 'pass123' },
      engineer: { username: 'engineer1', password: 'pass123' },
      manager: { username: 'manager1', password: 'pass123' }
    };

    const cred = credentials[role as keyof typeof credentials];
    setUsername(cred.username);
    setPassword(cred.password);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E1E1E 0%, #2C2C2C 100%)'
    }}>
      <div style={{
        background: '#2C2C2C',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        width: '400px',
        border: '1px solid #333'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            color: '#3498DB',
            fontSize: '36px',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            ParX
          </h1>
          <p style={{ color: '#999', margin: 0 }}>Industrial Analytics Platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#ECECEC',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1E1E1E',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#ECECEC',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#ECECEC',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1E1E1E',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#ECECEC',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#E74C3C',
              color: '#FFF',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#555' : '#3498DB',
              border: 'none',
              borderRadius: '4px',
              color: '#FFF',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #333'
        }}>
          <p style={{
            color: '#999',
            fontSize: '12px',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            Quick Login (Demo)
          </p>
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={() => quickLogin('operator')}
              style={{
                padding: '8px 16px',
                background: '#555',
                border: 'none',
                borderRadius: '4px',
                color: '#ECECEC',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Operator
            </button>
            <button
              type="button"
              onClick={() => quickLogin('engineer')}
              style={{
                padding: '8px 16px',
                background: '#555',
                border: 'none',
                borderRadius: '4px',
                color: '#ECECEC',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Engineer
            </button>
            <button
              type="button"
              onClick={() => quickLogin('manager')}
              style={{
                padding: '8px 16px',
                background: '#555',
                border: 'none',
                borderRadius: '4px',
                color: '#ECECEC',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
