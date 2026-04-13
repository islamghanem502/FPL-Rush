import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../services/api';
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

// challenges
export const useChallenges = () => {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const response = await api.get('/challenges');
      return response.data;
    }
  });
};

export const useCreateChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newChallenge) => api.post('/challenges/create', newChallenge),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    }
  });
};

export const useDeleteChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/challenges/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      alert("تم حذف التحدي بنجاح");
    }
  });
};

export const useEnrollChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars) => {
      const id = typeof vars === 'object' && vars && 'id' in vars ? vars.id : vars;
      const joinCode = typeof vars === 'object' && vars && 'joinCode' in vars ? vars.joinCode : undefined;
      return api.post(`/challenges/${id}/enroll`, joinCode != null ? { joinCode } : {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    }
  });
};

export const useChallengeStandings = (id) => {
  return useQuery({
    queryKey: ['standings', id],
    queryFn: async () => {
      const { data } = await api.get(`/challenges/${id}/standings`);
      return data;
    },
    enabled: !!id
  });
};

export const useCloseChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (challengeId) => {
      const { data } = await api.patch(`/challenges/${challengeId}/close`);
      return data;
    },
    onSuccess: () => {
      // ✅ التعديل هنا
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      alert("تم إنهاء التحدي وتتويج الأبطال بنجاح! 🏆");
    },
  });
};

// Admin reorder (drag & drop)
export const useReorderChallenges = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds) => {
      return api.post('/challenges/reorder', orderedIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    }
  });
};

// ─────────────────────────────────────────────
// PvP Hooks
// ─────────────────────────────────────────────

/** GET /pvp  — جلب كل تحديات PvP */
export const usePvPChallenges = () => {
  return useQuery({
    queryKey: ['pvpChallenges'],
    queryFn: async () => {
      const { data } = await api.get('/pvp');
      return data;
    },
  });
};

/** GET /pvp/search-players?query=...  — Admin: البحث عن لاعبين */
export const useSearchPlayers = (query) => {
  return useQuery({
    queryKey: ['searchPlayers', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data } = await api.get(`/pvp/search-players?query=${encodeURIComponent(query)}`);
      return data;
    },
    enabled: query?.length >= 2,
  });
};

/** GET /pvp/:id  — جلب تحدي PvP واحد بكل matchups بتاعته (مع gwDeadlinePassed) */
export const usePvPChallengeById = (id) => {
  return useQuery({
    queryKey: ['pvpChallenge', id],
    queryFn: async () => {
      const { data } = await api.get(`/pvp/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,        // 2 min — re-use cached data for 2 min
    refetchInterval: 1000 * 60 * 5,  // re-fetch every 5 min to pick up deadline changes
  });
};

/** GET /pvp/:id/standings */
export const usePvPStandings = (id) => {
  return useQuery({
    queryKey: ['pvpStandings', id],
    queryFn: async () => {
      const { data } = await api.get(`/pvp/${id}/standings`);
      return data;
    },
    enabled: !!id,
  });
};

/** GET /pvp/:id/my-prediction  — User: Get specific user prediction */
export const useMyPvPPrediction = (id) => {
  return useQuery({
    queryKey: ['myPvPPrediction', id],
    queryFn: async () => {
      const { data } = await api.get(`/pvp/${id}/my-prediction`);
      return data;
    },
    enabled: !!id,
    retry: false
  });
};

/** POST /pvp/create  — Admin: إنشاء تحدي PvP جديد */
export const useCreatePvPChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newChallenge) => api.post('/pvp/create', newChallenge),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pvpChallenges'] });
    },
  });
};

/** DELETE /pvp/:id  — Admin: حذف تحدي PvP */
export const useDeletePvPChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/pvp/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pvpChallenges'] });
      alert('تم حذف تحدي PvP بنجاح');
    },
  });
};

/** PATCH /pvp/:id/sync  — Admin: مزامنة نتائج تحدي PvP */
export const useSyncPvPResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/pvp/${id}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pvpChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['pvpStandings'] });
      alert('تم تحديث نتائج الـ PvP بنجاح ✅');
    },
  });
};

/** PATCH /pvp/:id/close  — Admin: إنهاء تحدي PvP وتثبيت النتائج */
export const useClosePvPChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/pvp/${id}/close`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pvpChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['pvpStandings'] });
      alert('تم إنهاء تحدي PvP وتتويج الأبطال بنجاح! 🏆');
    },
  });
};

/** POST /pvp/:id/predict  — User: تقديم التوقعات */
export const useSubmitPvPPrediction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, predictions }) =>
      api.post(`/pvp/${id}/predict`, { predictions }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['pvpChallenge', id] });
      queryClient.invalidateQueries({ queryKey: ['pvpStandings', id] });
    },
  });
};