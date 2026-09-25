import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '@/api/challenges.api';
import { ME } from './useAuth';

const KEYS = {
  public: ['challenges', 'public'],
  mine: ['challenges', 'mine'],
  one: (id) => ['challenges', 'one', id],
  standings: (id) => ['challenges', 'standings', id],
  invite: (id) => ['challenges', 'invite', id],
  preview: (code) => ['challenges', 'preview', code],
};

const MINUTE = 60 * 1000;
const isFrozen = (status) => status === 'finished';

// ── Reads ──────────────────────────────────────────────────────────────────

export const usePublicChallenges = () =>
  useQuery({ queryKey: KEYS.public, queryFn: async () => (await challengesApi.public()).data });

export const useMyChallenges = () =>
  useQuery({ queryKey: KEYS.mine, queryFn: async () => (await challengesApi.mine()).data });

export const useChallenge = (id) =>
  useQuery({
    queryKey: KEYS.one(id),
    queryFn: async () => (await challengesApi.one(id)).data,
    enabled: Boolean(id),
    // Once finalized the snapshot is immutable — stop polling.
    refetchInterval: (query) => (isFrozen(query.state.data?.status) ? false : MINUTE),
  });

export const useStandings = (id, status) =>
  useQuery({
    queryKey: KEYS.standings(id),
    queryFn: async () => (await challengesApi.standings(id)).data,
    enabled: Boolean(id),
    staleTime: isFrozen(status) ? Infinity : 0,
    refetchInterval: isFrozen(status) ? false : MINUTE,
  });

export const useInvite = (id, enabled) =>
  useQuery({
    queryKey: KEYS.invite(id),
    queryFn: async () => (await challengesApi.invite(id)).data,
    enabled: Boolean(id) && enabled,
    retry: false,
  });

export const useInvitePreview = (code) =>
  useQuery({
    queryKey: KEYS.preview(code),
    queryFn: async () => (await challengesApi.previewInvite(code)).data,
    enabled: Boolean(code),
    retry: false,
  });

// ── Writes ─────────────────────────────────────────────────────────────────

// Any write can move a challenge between lists, so refresh them all.
const useChallengeMutation = (mutationFn, extra) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      extra?.(queryClient, ...args);
    },
  });
};

export const useCreatePrivate = () => useChallengeMutation((payload) => challengesApi.createPrivate(payload));
export const useCreatePublic = () => useChallengeMutation((payload) => challengesApi.createPublic(payload));
export const useUpdateChallenge = () => useChallengeMutation(({ id, payload }) => challengesApi.update(id, payload));
export const useDeleteChallenge = () => useChallengeMutation((id) => challengesApi.remove(id));
export const useCloseChallenge = () => useChallengeMutation((id) => challengesApi.close(id));
export const useReorderChallenges = () => useChallengeMutation((ids) => challengesApi.reorder(ids));
export const useRotateInvite = () => useChallengeMutation((id) => challengesApi.rotateInvite(id));

export const useEnroll = () =>
  useChallengeMutation(
    (id) => challengesApi.enroll(id),
    (queryClient) => queryClient.invalidateQueries({ queryKey: ME }),
  );

export const useEnrollWithInvite = () =>
  useChallengeMutation(
    (code) => challengesApi.enrollWithInvite(code),
    (queryClient) => queryClient.invalidateQueries({ queryKey: ME }),
  );

export const useOwnerParticipation = () =>
  useChallengeMutation(({ id, mode }) => challengesApi.ownerParticipation(id, mode));
