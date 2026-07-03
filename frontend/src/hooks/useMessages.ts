'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Message } from '@/lib/types';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  loadMore: () => void;
  hasMore: boolean;
}

export function useMessages(conversationId: string | null): UseMessagesReturn {
  const { user, workspace } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const abortRef = useRef<AbortController | null>(null);

  const headers = {
    'x-user-id': user?.id || '',
    'x-workspace-id': workspace?.id || '',
  };

  const fetchMessages = useCallback(
    async (convId: string, pageNum: number = 1, append: boolean = false) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('limit', '50');

        const data = await api.get<{ messages: Message[] }>(
          `/inbox/conversations/${convId}/messages?${params}`,
          { headers }
        );

        setMessages((prev) => (append ? [...data.messages, ...prev] : data.messages));
        setHasMore(data.messages.length === 50);
        setPage(pageNum);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    },
    [headers]
  );

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    fetchMessages(conversationId, 1, false);
    return () => abortRef.current?.abort();
  }, [conversationId, fetchMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !text.trim()) return;

      try {
        await api.post(
          '/messages/send',
          { conversationId, text },
          { headers }
        );
        // Reload messages after sending
        await fetchMessages(conversationId, 1, false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      }
    },
    [conversationId, headers, fetchMessages]
  );

  const loadMore = useCallback(() => {
    if (!conversationId || loading || !hasMore) return;
    fetchMessages(conversationId, page + 1, true);
  }, [conversationId, loading, hasMore, page, fetchMessages]);

  return { messages, loading, error, sendMessage, loadMore, hasMore };
}
