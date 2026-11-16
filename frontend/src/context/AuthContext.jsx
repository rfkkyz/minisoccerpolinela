import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('polisoccer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('polisoccer_token'));
  const [loading, setLoading] = useState(true);

  // Sync /auth/me on mount if token exists
  useEffect(() => {
    let isMounted = true;
    if (token) {
      apiClient.auth.me()
        .then((res) => {
          if (isMounted && res.data) {
            setUser(res.data);
            localStorage.setItem('polisoccer_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          if (isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('polisoccer_token');
            localStorage.removeItem('polisoccer_user');
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('polisoccer_unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('polisoccer_unauthorized', handleUnauthorized);
    };
  }, [token]);

  const login = async (credentials) => {
    const res = await apiClient.auth.login(credentials);
    const token = res?.token || res?.data?.token;
    const user = res?.user || res?.data?.user;
    if (token) {
      localStorage.setItem('polisoccer_token', token);
      setToken(token);
    }
    if (user) {
      localStorage.setItem('polisoccer_user', JSON.stringify(user));
      setUser(user);
    }
    return res;
  };

  const register = async (formData) => {
    const res = await apiClient.auth.register(formData);
    const token = res?.token || res?.data?.token;
    const user = res?.user || res?.data?.user;
    if (token) {
      localStorage.setItem('polisoccer_token', token);
      setToken(token);
    }
    if (user) {
      localStorage.setItem('polisoccer_user', JSON.stringify(user));
      setUser(user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignore network error during logout
    } finally {
      localStorage.removeItem('polisoccer_token');
      localStorage.removeItem('polisoccer_user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedData) => {
    const nextUser = { ...user, ...updatedData };
    setUser(nextUser);
    localStorage.setItem('polisoccer_user', JSON.stringify(nextUser));
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.auth.me();
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('polisoccer_user', JSON.stringify(res.data));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

