import axios from 'axios';
import { getToken, clearToken } from './token';
import { queryClient } from './queryClient';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 means the session is gone. Drop the token and let <RequireAuth>
// send the user to the login screen on the next render.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      queryClient.setQueryData(['me'], null);
    }
    return Promise.reject(error);
  },
);

export const errorMessage = (error, fallback = 'حصل خطأ، جرّب تاني') =>
  error?.response?.data?.message || fallback;
