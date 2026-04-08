import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.7:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fpl_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fpl_token');
      localStorage.removeItem('fpl_id');
      localStorage.removeItem('fpl_user');
      if (!window.location.hash.includes('/login')) {
        window.location.href = '/#/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {

  // Step 1: Check if fpl_id exists and whether user needs setup or login
  checkId: (fpl_id) => api.post('/auth/check-id', { fpl_id }),

  // Step 2A: New / migrating user sets up their PIN
  setupPin: async (fpl_id, pin_code) => {
    const response = await api.post('/auth/setup-pin', { fpl_id, pin_code });
    if (response.data.token) {
      localStorage.setItem('fpl_token', response.data.token);
      localStorage.setItem('fpl_id', String(fpl_id));
      localStorage.setItem('fpl_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Step 2B: Existing user logs in with PIN
  login: async (fpl_id, pin_code) => {
    const response = await api.post('/auth/login', { fpl_id, pin_code });
    if (response.data.token) {
      localStorage.setItem('fpl_token', response.data.token);
      localStorage.setItem('fpl_id', String(fpl_id));
      localStorage.setItem('fpl_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Step 3 (optional): Save email / phone
  saveContact: (data) => api.post('/auth/save-contact', data),

  // League verification
  verifyLeague: () => api.post('/auth/verify-league'),

  // Current user
  getCurrentUser: () => api.get('/auth/me'),

  // Logout
  logout: () => {
    localStorage.removeItem('fpl_token');
    localStorage.removeItem('fpl_id');
    localStorage.removeItem('fpl_user');
  },

  // Helpers
  getStoredAuth: () => {
    const token = localStorage.getItem('fpl_token');
    const userStr = localStorage.getItem('fpl_user');
    let user = null;
    if (userStr) {
      try { user = JSON.parse(userStr); } catch { localStorage.removeItem('fpl_user'); }
    }
    return { token, user };
  },
};

// ── Challenge API (unchanged) ─────────────────────────────────────────────────
export const challengeAPI = {
  getChallenges: () => api.get('/challenges'),
  getChallengeDetails: (id) => api.get(`/challenges/${id}`),
  getStandings: (id) => api.get(`/challenges/${id}/standings`),
  enroll: (id, payload = {}) => api.post(`/challenges/${id}/enroll`, payload),
  closeChallenge: (id) => api.patch(`/challenges/${id}/close`),
};

// ── PvP API (unchanged) ───────────────────────────────────────────────────────
export const pvpAPI = {
  getChallenges: () => api.get('/pvp'),
  getChallengeById: (id) => api.get(`/pvp/${id}`),
  submitPrediction: (id, predictions) => api.post(`/pvp/${id}/predict`, { predictions }),
  getStandings: (id) => api.get(`/pvp/${id}/standings`),
  createChallenge: (data) => api.post('/pvp/create', data),
  syncResults: (id) => api.patch(`/pvp/${id}/sync`),
  closeChallenge: (id) => api.patch(`/pvp/${id}/close`),
  deleteChallenge: (id) => api.delete(`/pvp/${id}`),
};

export default api;