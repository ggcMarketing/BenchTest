import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('parx_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  logout: () => {
    localStorage.removeItem('parx_token');
    localStorage.removeItem('parx_user');
  }
};

export const tagsAPI = {
  getTree: () => api.get('/tags'),
  getList: () => api.get('/tags/list'),
  getHistorical: (tagPath: string, start?: number, end?: number, limit?: number) =>
    api.get(`/historical/${encodeURIComponent(tagPath)}`, {
      params: { start, end, limit }
    })
};

export const coilsAPI = {
  getAll: () => api.get('/coils'),
  getById: (coilId: string) => api.get(`/coils/${coilId}`),
  getCurrent: () => api.get('/coil/current'),
  getProfile: (coilId: string) => api.get(`/profile/${coilId}`)
};

export const alarmsAPI = {
  getActive: () => api.get('/alarms')
};

export default api;
