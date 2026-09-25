import { useQuery } from '@tanstack/react-query';
import { bonusApi } from '@/api/bonus.api';

const TEN_MINUTES = 10 * 60 * 1000;

// The global FPL gameweek. Public, cheap, and used across the app.
export const useCurrentGw = () =>
  useQuery({
    queryKey: ['bonus', 'currentGw'],
    queryFn: async () => (await bonusApi.currentGw()).data.currentGW,
    staleTime: TEN_MINUTES,
  });

// { teams: {id: {name, short_name}}, players: {id: {web_name, team}} }
export const useBootstrap = () =>
  useQuery({
    queryKey: ['bonus', 'bootstrap'],
    queryFn: async () => (await bonusApi.bootstrap()).data,
    staleTime: TEN_MINUTES,
  });

export const useLiveBonus = (gw) =>
  useQuery({
    queryKey: ['bonus', 'live', gw],
    queryFn: async () => (await bonusApi.live(gw)).data,
    enabled: Boolean(gw),
    refetchInterval: 60 * 1000,
    staleTime: 55 * 1000,
    placeholderData: (previous) => previous,
  });
