import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminRole = (userData) => setIsAdmin(userData?.role === 'admin');

  // ── Update partial user info ─────────────────────────────────────────────
  const updateUserInfo = useCallback((newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('fpl_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Register: accepts email + password ───────────────────────────────────
  const register = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(email, password);
      const { user: userData } = response.data;
      setUser(userData);
      checkAdminRole(userData);
      return {
        success: true,
        user: userData,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'فشل إنشاء الحساب',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Login: accepts email + password ──────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const { user: userData } = response.data;
      setUser(userData);
      checkAdminRole(userData);
      return {
        success: true,
        user: userData,
        isAdmin: userData.role === 'admin',
        accountStatus: userData.accountStatus,
        isVerified: userData.isVerified
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'فشل تسجيل الدخول',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Link FPL ID ──────────────────────────────────────────────────────────
  const linkFpl = useCallback(async (fpl_id) => {
    setIsLoading(true);
    try {
      const response = await authAPI.linkFpl(fpl_id);
      const { user: userData } = response.data;
      setUser(userData);
      checkAdminRole(userData);
      return {
        success: true,
        user: userData,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'فشل ربط حساب FPL',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Restore session from stored token ───────────────────────────────────
  const loadUser = useCallback(async () => {
    const { token } = authAPI.getStoredAuth();
    if (!token) { setIsLoading(false); return; }

    try {
      const response = await authAPI.getCurrentUser();
      if (response.data?.user) {
        setUser(response.data.user);
        checkAdminRole(response.data.user);
        localStorage.setItem('fpl_user', JSON.stringify(response.data.user));
      }
    } catch {
      authAPI.logout();
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Google Login: accepts credential (ID Token) ──────────────────────────
  const googleLogin = useCallback(async (credential) => {
    setIsLoading(true);
    try {
      const response = await authAPI.googleAuth(credential);
      const { user: userData } = response.data;
      setUser(userData);
      checkAdminRole(userData);
      return {
        success: true,
        user: userData,
        isAdmin: userData.role === 'admin',
        accountStatus: userData.accountStatus,
        isVerified: userData.isVerified
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'فشل تسجيل الدخول بواسطة Google',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAdmin(false);
    authAPI.logout();
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        register,
        login,
        googleLogin,
        linkFpl,
        logout,
        loadUser,
        updateUserInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};