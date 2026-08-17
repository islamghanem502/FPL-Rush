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

  // Register with Email + Password
  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    if (response.data.token) {
      localStorage.setItem('fpl_token', response.data.token);
      localStorage.setItem('fpl_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Google Sign-In / OAuth
  googleAuth: async (credential) => {
    const response = await api.post('/auth/google', { credential });
    if (response.data.token) {
      localStorage.setItem('fpl_token', response.data.token);
      if (response.data.user?.fpl_id) {
        localStorage.setItem('fpl_id', String(response.data.user.fpl_id));
      }
      localStorage.setItem('fpl_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Login with Email + Password
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('fpl_token', response.data.token);
      if (response.data.user?.fpl_id) {
        localStorage.setItem('fpl_id', String(response.data.user.fpl_id));
      }
      localStorage.setItem('fpl_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Link FPL ID after registration/login
  linkFpl: async (fpl_id) => {
    const response = await api.post('/auth/link-fpl', { fpl_id });
    if (response.data.user) {
      localStorage.setItem('fpl_id', String(fpl_id));
      localStorage.setItem('fpl_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Forgot password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  // Verify reset OTP code
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),

  // Reset password
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword }),

  // League verification
  verifyLeague: async () => {
    const response = await api.post('/auth/verify-league');
    if (response.data.user) {
      const stored = authAPI.getStoredAuth().user || {};
      localStorage.setItem('fpl_user', JSON.stringify({ ...stored, ...response.data.user }));
    }
    return response;
  },

  // Current user
  getCurrentUser: () => api.get('/auth/me'),

  // Update profile details (phone, country, favoriteTeam, bio, email)
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    if (response.data.user) {
      const stored = authAPI.getStoredAuth().user || {};
      localStorage.setItem('fpl_user', JSON.stringify({ ...stored, ...response.data.user }));
    }
    return response;
  },

  // Upload avatar image to Cloudinary
  uploadAvatar: async (image) => {
    const response = await api.post('/auth/upload-avatar', { image });
    if (response.data.user) {
      const stored = authAPI.getStoredAuth().user || {};
      localStorage.setItem('fpl_user', JSON.stringify({ ...stored, ...response.data.user }));
    }
    return response;
  },

  // Get FPL gameweek history & chips
  getFplHistory: () => api.get('/auth/fpl-history'),

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


// ── Challenge API ─────────────────────────────────────────────────────────────
export const challengeAPI = {
  getChallenges: () => api.get('/challenges'),
  getChallengeDetails: (id) => api.get(`/challenges/${id}`),
  getStandings: (id) => api.get(`/challenges/${id}/standings`),
  enroll: (id, payload = {}) => api.post(`/challenges/${id}/enroll`, payload),
  closeChallenge: (id) => api.patch(`/challenges/${id}/close`),
};

export default api;