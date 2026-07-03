'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Followup } from '@/lib/types';

interface UseFollowupsOptions {
  status?: string;
}

interface FollowupStats {
  total: number;
  pending: number;
  overdue: number;
  completed: number;
}

interface UseFollowupsReturn {
  followups: Followup[];
  loading: boolean;
  error: string | null;
  mutate: () => void;
  stats: FollowupStats;
}

export function useFollowups(options?: UseFollowupsOptions): UseFollowupsReturn {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const headers = {
    'x-user-id': user?.id || '',
    'x-workspace-id': workspace?.id || '',
  };

  const fetchFollowups = useCallback(async () => {
    if (!user?.id || !workspace?.id || authLoading) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ followups: Followup[] }>('/followups', { headers });
      setFollowups(data.followups);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load followups');
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspace?.id, authLoading]);

  useEffect(() => {
    fetchFollowups();
    return () => abortRef.current?.abort();
  }, [fetchFollowups]);

  const filteredFollowups = options?.status
    ? followups.filter((f) => f.status === options.status)
    : followups;

  const now = new Date();
  const stats: FollowupStats = {
    total: followups.length,
    pending: followups.filter((f) => f.status === 'pending').length,
    overdue: followups.filter((f) => f.status === 'pending' && new Date(f.dueAt) < now).length,
    completed: followups.filter((f) => f.status === 'done').length,
  };

  return { followups: filteredFollowups, loading, error, mutate: fetchFollowups, stats };
}
