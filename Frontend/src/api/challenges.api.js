import { api } from '@/lib/api';

const code = (inviteCode) => encodeURIComponent(inviteCode);

export const challengesApi = {
  public: () => api.get('/challenges/public'),
  mine: () => api.get('/challenges/mine'),
  one: (id) => api.get(`/challenges/${id}`),
  standings: (id) => api.get(`/challenges/${id}/standings`),
  enroll: (id) => api.post(`/challenges/${id}/enroll`),

  createPrivate: (payload) => api.post('/challenges/private', payload),
  createPublic: (payload) => api.post('/challenges/public', payload),
  update: (id, payload) => api.patch(`/challenges/${id}`, payload),
  remove: (id) => api.delete(`/challenges/${id}`),
  close: (id) => api.patch(`/challenges/${id}/close`),
  reorder: (orderedIds) => api.post('/challenges/reorder', { orderedIds }),

  invite: (id) => api.get(`/challenges/${id}/invite`),
  rotateInvite: (id) => api.post(`/challenges/${id}/invite/rotate`),
  previewInvite: (inviteCode) => api.get(`/challenges/invite/${code(inviteCode)}`),
  enrollWithInvite: (inviteCode) => api.post(`/challenges/invite/${code(inviteCode)}/enroll`),
  ownerParticipation: (id, mode) => api.patch(`/challenges/${id}/owner-participation`, { mode }),
};
