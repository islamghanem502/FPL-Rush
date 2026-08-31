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
  enabled: Boolean(id),
  // Poll only while the challenge can still change. Once finalized, the
  // server snapshot is immutable and this query stops by itself.
  refetchInterval: (query) => query.state.data?.status === 'finished' ? false : 60 * 1000
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

export const useSetOwnerParticipation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mode }) => challengeAPI.setOwnerParticipation(id, mode),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge', id] });
      queryClient.invalidateQueries({ queryKey: ['standings', id] });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    }
  });
};

export const useChallengeStandings = (id, status) => useQuery({
  queryKey: ['standings', id],
  queryFn: async () => (await challengeAPI.getStandings(id)).data,
  enabled: Boolean(id),
  // Once FPL results are finalized, the endpoint is immutable. Do not poll
  // or refetch the score table after that point.
  staleTime: status === 'finished' ? Infinity : 0,
  refetchInterval: status === 'finished' ? false : 60 * 1000,
  refetchOnWindowFocus: status !== 'finished'
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
