import { api } from '@/lib/api';

export const bonusApi = {
  currentGw: () => api.get('/bonus/current-gw'),
  bootstrap: () => api.get('/bonus/teams'),
  live: (gw) => api.get(`/bonus/live/${gw}`),
};
