'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export function useUnreadCounts(
  workspaceId: string = 'd805d45d-0e17-48b1-911a-4560b5a61adc',
  userId: string = 'aa536bed-b44a-495b-b59e-d710003eebc8'
) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const isFirstRender = useRef(true);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await api.get<{ totalUnread: number }>('/inbox/unread-counts', {
        headers: { 'x-user-id': userId, 'x-workspace-id': workspaceId },
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
