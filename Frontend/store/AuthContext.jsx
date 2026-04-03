import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check Admin
  const checkAdminRole = (userData) => {
    setIsAdmin(userData?.role === 'admin');
  };

  // Update User Info
  const updateUserInfo = useCallback((newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      // Update LocalStorage
      const stored = JSON.parse(localStorage.getItem('user_data') || '{}');
      localStorage.setItem('user_data', JSON.stringify({ ...stored, ...updated }));
      return updated;
    });
  }, []);

  // Login Function
  const login = async (emailOrData, password = null) => {
    setIsLoading(true);
    try {
      let userData;
      let token;

      // If sent email and password (Login)
      if (password) {
        const response = await authAPI.login(emailOrData, password);
        userData = response.data.user;
        token = response.data.token;
      }
      // If sent data and token ready (After Register)
      else {
        userData = emailOrData.user;
        token = emailOrData.token;
        // Store token manually because we didn't go to authAPI.login
        localStorage.setItem('auth_token', token);
      }

      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      checkAdminRole(userData);

      return {
        success: true,
        isAdmin: userData.role === 'admin',
        isVerified: userData.isVerified
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Authentication failed",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const loadUser = useCallback(async () => {
    const { token } = authAPI.getStoredAuth();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.getCurrentUser();
      if (response.data?.user) {
        setUser(response.data.user);
        checkAdminRole(response.data.user);
      }
    } catch (error) {
      console.error("Session expired or invalid");
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAdmin(false);
    authAPI.logout();
    localStorage.removeItem('user_data');
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, isLoading, login, logout, loadUser, updateUserInfo }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};