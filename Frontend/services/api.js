import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://fplrush.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  verifyLeague: () => api.post('/auth/verify-league'),

  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
  getCurrentUser: () => api.get('/auth/me'),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredAuth: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let user = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    return { token, user };
  }
};


export const challengeAPI = {
  getChallenges: () => api.get('/challenges'),
  getChallengeDetails: (id) => api.get(`/challenges/${id}`),
  getStandings: (id) => api.get(`/challenges/${id}/standings`),
  enroll: (id, payload = {}) => api.post(`/challenges/${id}/enroll`, payload),
  closeChallenge: (id) => api.patch(`/challenges/${id}/close`),
};


export const pvpAPI = {
  // User routes
  getChallenges: () => api.get('/pvp'),
  getChallengeById: (id) => api.get(`/pvp/${id}`),
  submitPrediction: (id, predictions) => api.post(`/pvp/${id}/predict`, { predictions }),
  getStandings: (id) => api.get(`/pvp/${id}/standings`),
  // Admin Only
  createChallenge: (data) => api.post('/pvp/create', data),
  syncResults: (id) => api.patch(`/pvp/${id}/sync`),
  closeChallenge: (id) => api.patch(`/pvp/${id}/close`),
  deleteChallenge: (id) => api.delete(`/pvp/${id}`),
};
export default api;