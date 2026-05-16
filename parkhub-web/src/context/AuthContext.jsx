import { createContext, useContext, useEffect, useState } from 'react';
import { api, setInMemoryToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (!settled) setLoading(false);
    }, 4000);

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
    const onUnauthorized = () => setUser(null);
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
      setInMemoryToken(res.data.tokens.access_token);
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
