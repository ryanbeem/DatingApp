import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAuthToken, setUnauthorizedHandler, type RegisterInput } from './api';
import { getItem, setItem } from './storage';
import type { Profile } from './types';

const TOKEN_KEY = 'auth_token';

interface AuthState {
  loading: boolean;
  me: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  setMe: (profile: Profile) => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Profile | null>(null);

  const clear = useCallback(async () => {
    setAuthToken(null);
    setMe(null);
    await setItem(TOKEN_KEY, null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void clear());
    (async () => {
      const token = await getItem(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          setMe(await api.me());
        } catch {
          await clear();
        }
      }
      setLoading(false);
    })();
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      me,
      setMe,
      signIn: async (email, password) => {
        const res = await api.login(email, password);
        setAuthToken(res.token);
        await setItem(TOKEN_KEY, res.token);
        setMe(await api.me());
      },
      register: async (input) => {
        const res = await api.register(input);
        setAuthToken(res.token);
        await setItem(TOKEN_KEY, res.token);
        setMe(await api.me());
      },
      signOut: async () => {
        try {
          await api.logout();
        } catch {}
        await clear();
      },
      refreshMe: async () => setMe(await api.me()),
    }),
    [loading, me, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
