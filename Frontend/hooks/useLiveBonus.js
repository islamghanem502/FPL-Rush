import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.7:5000/api';

/**
 * Fetches FPL teams + players map from our backend (cached 10 min)
 */
export const useBootstrapData = () => {
  return useQuery({
    queryKey: ['fplBootstrap'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/bonus/teams`);
      return data; // { teams: {...}, players: {...} }
    },
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
};

/**
 * Fetches current gameweek from our backend
 */
export const useCurrentGameweek = () => {
  return useQuery({
    queryKey: ['fplCurrentGW'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/bonus/current-gw`);
      return data.currentGW;
    },
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
};

/**
 * Fetches live bonus data for a specific gameweek.
 * Polls every 60 seconds while the page is active.
 */
export const useLiveBonus = (event) => {
  return useQuery({
    queryKey: ['liveBonus', event],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/bonus/live/${event}`);
      return data;
    },
    enabled: !!event && event > 0,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
    staleTime: 55 * 1000,
    retry: 1,
  });
};
