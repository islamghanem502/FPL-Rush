// The JWT is the only thing we persist. Everything else lives in React Query.
const KEY = 'fpl_token';

export const getToken = () => localStorage.getItem(KEY);
export const setToken = (token) => localStorage.setItem(KEY, token);
export const clearToken = () => localStorage.removeItem(KEY);
export const hasToken = () => Boolean(getToken());
