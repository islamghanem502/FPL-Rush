import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor لإضافة التوكن في كل طلب
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

// Interceptor للتعامل مع انتهاء الجلسة (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // بنعمل redirect فقط لو مش في صفحة اللوجين أصلاً
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // تعديل الـ login عشان نرجعه "صافي" للـ Context وهو اللي يخزن
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

  // إضافة روت التوثيق هنا ليكون منظماً
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

// Challenge APIs
export const challengeAPI = {
  getChallenges: () => api.get('/challenges'),
  getChallengeDetails: (id) => api.get(`/challenges/${id}`),
  getStandings: (id) => api.get(`/challenges/${id}/standings`),
  /** @param {string} id - Challenge ID. @param {{ joinCode?: string }} payload - Optional; include joinCode when challenge requires it. */
  enroll: (id, payload = {}) => api.post(`/challenges/${id}/enroll`, payload),
  closeChallenge: (id) => api.patch(`/challenges/${id}/close`),
};

export default api;