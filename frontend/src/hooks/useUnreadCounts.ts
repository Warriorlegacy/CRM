'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export function useUnreadCounts(
  workspaceId?: string,
  userId?: string
) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const isFirstRender = useRef(true);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await api.get<{ totalUnread: number }>('/inbox/unread-counts', {
        headers: {
          ...(userId && { 'x-user-id': userId }),
          ...(workspaceId && { 'x-workspace-id': workspaceId }),
        },
      });
      setTotalUnread(res.totalUnread);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [workspaceId, userId]);

  const updateUnreadCount = useCallback((contactId: string, count: number) => {
    setUnreadCounts((prev) => {
      const newCounts = { ...prev, [contactId]: count };
      const total = Object.values(newCounts).reduce((a, b) => a + b, 0);
      setTotalUnread(total);
      return newCounts;
    });
  }, []);

  useEffect(() => {
    // Skip on first render - initial state is already set
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchUnreadCounts();
  }, [workspaceId, userId]);

  return {
    unreadCounts,
    totalUnread,
    updateUnreadCount,
    refresh: fetchUnreadCounts,
  };
}
