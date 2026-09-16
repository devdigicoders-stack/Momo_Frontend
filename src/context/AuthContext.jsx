import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user on initial load or token change
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with backend to ensure user wasn't deactivated/deleted
          const res = await authService.getMe();
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          logout();
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password, requiredRole) => {
    try {
      const payload = { password };
      if (String(identifier).includes('@')) {
        payload.email = identifier.trim().toLowerCase();
      } else {
        payload.mobile = identifier.trim();
      }
      if (requiredRole) {
        payload.role = requiredRole;
      }

      const res = await authService.login(payload);
      if (res.success) {
        const { token: receivedToken, user: receivedUser } = res;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to login. Please check your credentials.';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
