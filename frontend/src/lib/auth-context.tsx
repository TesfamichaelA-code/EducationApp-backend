'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo } from 'react';

import { api } from './api';

export type Role = 'student' | 'teacher' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string;
  isActive: boolean;
  lastLoginAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, name: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<AuthUser | null> => {
      try {
        const { data } = await api.get<AuthUser>('/auth/me');
        return data;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const { data } = await api.post<{ user: AuthUser }>('/auth/login', { email, password });
      queryClient.setQueryData(['me'], data.user);
      return data.user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (email: string, name: string, password: string): Promise<AuthUser> => {
      const { data } = await api.post<{ user: AuthUser }>('/auth/register', {
        email,
        name,
        password,
      });
      queryClient.setQueryData(['me'], data.user);
      return data.user;
    },
    [queryClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // best-effort — clear local state regardless
    }
    queryClient.setQueryData(['me'], null);
    queryClient.clear();
    router.push('/login');
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      loading: isLoading,
      refresh: async () => {
        await refetch();
      },
      login,
      register,
      logout,
    }),
    [data, isLoading, refetch, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
