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

  // ── Login: accepts fpl_id + pin_code ────────────────────────────────────
  const login = useCallback(async (fpl_id, pin_code) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(fpl_id, pin_code);
      const { user: userData } = response.data;
      setUser(userData);
      checkAdminRole(userData);
      return {
        success: true,
        isAdmin: userData.role === 'admin',
        isVerified: userData.isVerified,
        hasContact: !!(userData.email || userData.phone),
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

  // ── Setup PIN (new / migrating user) ────────────────────────────────────
  const setupPin = useCallback(async (fpl_id, pin_code) => {
    setIsLoading(true);
    try {
      const response = await authAPI.setupPin(fpl_id, pin_code);
      const { user: userData } = response.data;
      setUser(userData);
      checkAdminRole(userData);
      return {
        success: true,
        isAdmin: userData.role === 'admin',
        isVerified: userData.isVerified,
        hasContact: !!(userData.email || userData.phone),
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'فشل إعداد الـ PIN',
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
      logout();
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
      value={{ user, isAdmin, isLoading, login, setupPin, logout, loadUser, updateUserInfo }}
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