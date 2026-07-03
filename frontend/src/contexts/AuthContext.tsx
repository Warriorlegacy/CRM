'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { API_BASE } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Workspace {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, workspaceName?: string) => Promise<string>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry
const DEFAULT_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24h default

function parseJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    if (typeof decoded.exp === 'number') {
      return decoded.exp * 1000; // convert to ms
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedWorkspace = localStorage.getItem('auth_workspace');

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('auth_user');
        }
      }
      if (storedWorkspace) {
        try {
          setWorkspace(JSON.parse(storedWorkspace));
        } catch {
          localStorage.removeItem('auth_workspace');
        }
      }
    }
    setIsLoading(false);
  }, []);

  // Persist auth state to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (workspace) {
      localStorage.setItem('auth_workspace', JSON.stringify(workspace));
    } else {
      localStorage.removeItem('auth_workspace');
    }
  }, [workspace]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setWorkspace(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_workspace');
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      setToken(data.data.token);
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  }, [token, logout]);

  // Schedule automatic token refresh before expiry
  useEffect(() => {
    if (!token) return;

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const expMs = parseJwtExp(token);
    const nowMs = Date.now();
    const lifetimeMs = expMs ? expMs - nowMs : DEFAULT_TOKEN_LIFETIME_MS;
    const refreshIn = Math.max(lifetimeMs - TOKEN_REFRESH_BUFFER_MS, 30_000); // at least 30s

    refreshTimerRef.current = setTimeout(() => {
      refreshToken();
    }, refreshIn);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [token, refreshToken]);

  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = useMemo(
    () => ({
      user,
      workspace,
      token,
      isLoading,
      isAuthenticated,
      login: async (email: string, password: string) => {
        setIsLoading(true);
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
          }

          const data = await response.json();
          setToken(data.data.token);
          setUser(data.data.user);
          setWorkspace(data.data.workspace);
        } finally {
          setIsLoading(false);
        }
      },
      register: async (email: string, password: string, name: string, workspaceName?: string) => {
        setIsLoading(true);
        try {
          const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, workspaceName }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
          }

          const data = await response.json();
          return data.message || data.data?.message || 'Registration successful. Please verify your email before signing in.';
        } finally {
          setIsLoading(false);
        }
      },
      logout,
      refreshToken,
    }),
    [user, workspace, token, isLoading, isAuthenticated, logout, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
