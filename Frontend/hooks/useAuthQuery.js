import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, challengeAPI } from '../services/api';
import api from '../services/api';

export const useUser = () => {
  const token = localStorage.getItem('fpl_token');

  return useQuery({
    queryKey: ['authUser', token],
    queryFn: async () => {
      if (!token) return null;
      const response = await authAPI.getCurrentUser();
      return response.data.user;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!token,
    retry: false
  });
};

export const usePublicChallenges = () => useQuery({
  queryKey: ['publicChallenges'],
  queryFn: async () => (await challengeAPI.getPublicChallenges()).data
});

// Old components can keep this hook while they are being migrated.
export const useChallenges = usePublicChallenges;

export const useMyChallenges = () => useQuery({
  queryKey: ['myChallenges'],
  queryFn: async () => (await challengeAPI.getMyChallenges()).data
});

export const useChallengeDetails = (id) => useQuery({
  queryKey: ['challenge', id],
  queryFn: async () => (await challengeAPI.getChallengeDetails(id)).data,
  enabled: Boolean(id)
});

const invalidateChallengeQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['publicChallenges'] });
  queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
  queryClient.invalidateQueries({ queryKey: ['challenge'] });
  queryClient.invalidateQueries({ queryKey: ['standings'] });
};

export const useCreatePrivateChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => challengeAPI.createPrivate(payload),
    onSuccess: () => invalidateChallengeQueries(queryClient)
  });
};

export const useCreatePublicChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => challengeAPI.createPublic(payload),
    onSuccess: () => invalidateChallengeQueries(queryClient)
  });
};

// Existing admin page name retained as a public-create alias.
export const useCreateChallenge = useCreatePublicChallenge;

export const useUpdateChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => challengeAPI.update(id, payload),
    onSuccess: () => invalidateChallengeQueries(queryClient)
  });
};

export const useDeleteChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => challengeAPI.remove(id),
    onSuccess: () => invalidateChallengeQueries(queryClient)
  });
};

export const useEnrollChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => challengeAPI.enroll(typeof id === 'object' ? id.id : id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    }
  });
};

export const usePrivateInvite = (inviteCode) => useQuery({
  queryKey: ['privateInvite', inviteCode],
  queryFn: async () => (await challengeAPI.previewPrivateInvite(inviteCode)).data,
  enabled: Boolean(inviteCode),
  retry: false
});

export const useEnrollWithPrivateInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode) => challengeAPI.enrollWithPrivateInvite(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      queryClient.invalidateQueries({ queryKey: ['challenge'] });
    }
  });
};

export const usePrivateInviteLink = (id, enabled = true) => useQuery({
  queryKey: ['privateInviteLink', id],
  queryFn: async () => (await challengeAPI.getPrivateInvite(id)).data,
  enabled: Boolean(id) && enabled,
  retry: false
});

export const useRotatePrivateInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => challengeAPI.rotatePrivateInvite(id),
    onSuccess: (_, id) => queryClient.invalidateQueries({ queryKey: ['privateInviteLink', id] })
  });
};

export const useChallengeStandings = (id) => useQuery({
  queryKey: ['standings', id],
  queryFn: async () => (await challengeAPI.getStandings(id)).data,
  enabled: Boolean(id)
});

export const useCloseChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId) => challengeAPI.closeChallenge(challengeId),
    onSuccess: () => invalidateChallengeQueries(queryClient)
  });
};

export const useReorderChallenges = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds) => api.post('/challenges/reorder', { orderedIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['publicChallenges'] })
  });
};
