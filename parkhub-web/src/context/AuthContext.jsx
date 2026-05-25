import { createContext, useContext, useEffect, useState } from 'react';
import { api, setInMemoryToken, getInMemoryToken } from '../api/client';

const AuthContext = createContext(null);

// Restore token from localStorage on app load
function restoreTokenFromStorage() {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem('parkhub_access_token');
  if (stored) {
    setInMemoryToken(stored);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (!settled) setLoading(false);
    }, 4000);

    // Restore token from localStorage first
    restoreTokenFromStorage();

    api.me().then(res => {
      if (res.success && res.data) setUser(res.data);
    }).finally(() => {
      settled = true;
      window.clearTimeout(timeoutId);
      setLoading(false);
    });

    return () => {
      settled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setInMemoryToken(null);
      localStorage.removeItem('parkhub_access_token');
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  async function login(username, password, two_factor_code) {
    const res = await api.login(username, password, two_factor_code);

    if (res.success && res.data && res.data.requires_2fa) {
      return { success: false, requires2fa: true, error: res.data.message };
    }

    if (
      res.success &&
      res.data &&
      res.data.tokens?.access_token
    ) {
      const token = res.data.tokens.access_token;
      setInMemoryToken(token);
      // Persist token to localStorage for page navigation survival
      localStorage.setItem('parkhub_access_token', token);
      const me = await api.me();
      if (me.success && me.data) {
        setUser(me.data);
        return { success: true };
      }
    }
    return { success: false, error: res.error?.message || 'Login failed' };
  }

  async function logout() {
    await api.logout();
    setInMemoryToken(null);
    localStorage.removeItem('parkhub_access_token');
    setUser(null);
  }

  async function refreshUser() {
    const res = await api.me();
    if (res.success && res.data) setUser(res.data);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
