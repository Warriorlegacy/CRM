'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Template } from '@/lib/types';

interface UseTemplatesReturn {
  templates: Template[];
  loading: boolean;
  error: string | null;
  mutate: () => void;
  create: (data: { title: string; body: string }) => Promise<void>;
  update: (id: string, data: { title: string; body: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useTemplates(): UseTemplatesReturn {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const headers = {
    'x-user-id': user?.id || '',
    'x-workspace-id': workspace?.id || '',
  };

  const fetchTemplates = useCallback(async () => {
    if (!user?.id || !workspace?.id || authLoading) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ templates: Template[] }>('/templates', { headers });
      setTemplates(data.templates);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspace?.id, authLoading]);

  useEffect(() => {
    fetchTemplates();
    return () => abortRef.current?.abort();
  }, [fetchTemplates]);

  const create = useCallback(
    async (data: { title: string; body: string }) => {
      await api.post('/templates', data, { headers });
      await fetchTemplates();
    },
    [headers, fetchTemplates]
  );

  const update = useCallback(
    async (id: string, data: { title: string; body: string }) => {
      await api.patch(`/templates/${id}`, data, { headers });
      await fetchTemplates();
    },
    [headers, fetchTemplates]
  );

  const remove = useCallback(
    async (id: string) => {
      await api.delete(`/templates/${id}`, { headers });
      await fetchTemplates();
    },
    [headers, fetchTemplates]
  );

  return { templates, loading, error, mutate: fetchTemplates, create, update, remove };
}
