'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Contact } from '@/lib/types';

interface UseContactsOptions {
  stage?: string;
  channel?: string;
  search?: string;
  limit?: number;
}

interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  mutate: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export function useContacts(options?: UseContactsOptions): UseContactsReturn {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const abortRef = useRef<AbortController | null>(null);

  const headers = {
    'x-user-id': user?.id || '',
    'x-workspace-id': workspace?.id || '',
  };

  const fetchContacts = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!user?.id || !workspace?.id || authLoading) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('limit', String(options?.limit || 50));
        if (options?.stage) params.set('stage', options.stage);
        if (options?.channel) params.set('channel', options.channel);
        if (options?.search) params.set('search', options.search);

        const data = await api.get<{ contacts: Contact[]; total?: number; hasMore?: boolean }>(
          `/contacts?${params}`,
          { headers }
        );

        setContacts((prev) => (append ? [...prev, ...data.contacts] : data.contacts));
        setHasMore(data.hasMore ?? data.contacts.length === (options?.limit || 50));
        setPage(pageNum);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    },
    [user?.id, workspace?.id, authLoading, options?.stage, options?.channel, options?.search, options?.limit]
  );

  useEffect(() => {
    fetchContacts(1, false);
    return () => abortRef.current?.abort();
  }, [fetchContacts]);

  const mutate = useCallback(() => {
    fetchContacts(1, false);
  }, [fetchContacts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchContacts(page + 1, true);
    }
  }, [fetchContacts, loading, hasMore, page]);

  return { contacts, loading, error, mutate, loadMore, hasMore };
}
