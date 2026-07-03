'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Conversation } from '@/lib/types';

interface UseConversationsOptions {
  status?: string;
  channel?: string;
}

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  mutate: () => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export function useConversations(options?: UseConversationsOptions): UseConversationsReturn {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const headers = {
    'x-user-id': user?.id || '',
    'x-workspace-id': workspace?.id || '',
  };

  const fetchConversations = useCallback(async () => {
    if (!user?.id || !workspace?.id || authLoading) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options?.channel) params.set('channel', options.channel);
      if (options?.status) params.set('status', options.status);

      const data = await api.get<{ conversations: Conversation[] }>(
        `/inbox/conversations?${params}`,
        { headers }
      );

      setConversations(data.conversations);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspace?.id, authLoading, options?.channel, options?.status]);

  useEffect(() => {
    fetchConversations();
    return () => abortRef.current?.abort();
  }, [fetchConversations]);

  const mutate = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, mutate, selectedId, setSelectedId };
}
