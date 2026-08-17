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