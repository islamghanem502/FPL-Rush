import { api } from '@/lib/api';

export const authApi = {
  register: (email, password) => api.post('/auth/register', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  google: (credential) => api.post('/auth/google', { credential }),
  me: () => api.get('/auth/me'),
  linkFpl: (fpl_id) => api.post('/auth/link-fpl', { fpl_id }),
  verifyLeague: () => api.post('/auth/verify-league'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar: (image) => api.post('/auth/upload-avatar', { image }),
  fplHistory: () => api.get('/auth/fpl-history'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword }),
};
