'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { DashboardStats } from '@/lib/types';

interface UseDashboardReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

export function useDashboard(period: string = '7d'): UseDashboardReturn {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const headers = {
    'x-user-id': user?.id || '',
    'x-workspace-id': workspace?.id || '',
  };

  const fetchStats = useCallback(async () => {
    if (!user?.id || !workspace?.id || authLoading) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ analytics: DashboardStats }>(
        `/analytics?period=${period}`,
        { headers }
      );
      setStats(data.analytics);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspace?.id, authLoading, period]);

  useEffect(() => {
    fetchStats();
    return () => abortRef.current?.abort();
  }, [fetchStats]);

  return { stats, loading, error };
}
