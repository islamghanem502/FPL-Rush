import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { hasToken, setToken, clearToken } from '@/lib/token';

export const ME = ['me'];

// The single source of truth for "who is logged in".
export const useMe = () =>
  useQuery({
    queryKey: ME,
    queryFn: async () => (await authApi.me()).data.user,
    enabled: hasToken(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

// Login / register / google all answer { token, user }. Store the token,
// seed the cache so the next screen paints instantly, then refetch the full
// profile (register only returns a partial user).
const useSession = (request) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: ({ data }) => {
      setToken(data.token);
      queryClient.setQueryData(ME, data.user);
      queryClient.invalidateQueries({ queryKey: ME });
    },
  });
};

export const useLogin = () => useSession(({ email, password }) => authApi.login(email, password));
export const useRegister = () => useSession(({ email, password }) => authApi.register(email, password));
export const useGoogleLogin = () => useSession((credential) => authApi.google(credential));

export const useLogout = () => {
  const queryClient = useQueryClient();
  return () => {
    clearToken();
    queryClient.clear();
  };
};

// Mutations that answer { user } — keep the cache in step with the server.
const useProfileMutation = (request) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: ({ data }) => {
      if (data.user) queryClient.setQueryData(ME, (previous) => ({ ...previous, ...data.user }));
      queryClient.invalidateQueries({ queryKey: ME });
    },
  });
};

export const useLinkFpl = () => useProfileMutation((fplId) => authApi.linkFpl(fplId));
export const useVerifyLeague = () => useProfileMutation(() => authApi.verifyLeague());
export const useUpdateProfile = () => useProfileMutation((data) => authApi.updateProfile(data));
export const useUploadAvatar = () => useProfileMutation((image) => authApi.uploadAvatar(image));

export const useFplHistory = (enabled = true) =>
  useQuery({
    queryKey: ['fplHistory'],
    queryFn: async () => (await authApi.fplHistory()).data.history,
    enabled,
    staleTime: 10 * 60 * 1000,
  });

// Password reset is three requests; none of them touch the session.
export const useForgotPassword = () => useMutation({ mutationFn: (email) => authApi.forgotPassword(email) });
export const useVerifyResetCode = () =>
  useMutation({ mutationFn: ({ email, code }) => authApi.verifyResetCode(email, code) });
export const useResetPassword = () =>
  useMutation({ mutationFn: ({ email, code, password }) => authApi.resetPassword(email, code, password) });
