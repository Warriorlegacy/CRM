'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export function useUnreadCounts(
  workspaceId: string = 'd805d45d-0e17-48b1-911a-4560b5a61adc',
  userId: string = 'aa536bed-b44a-495b-b59e-d710003eebc8'
) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await api.get('/inbox/unread-counts', {
        headers: { 'x-user-id': userId, 'x-workspace-id': workspaceId },
      });
      setTotalUnread(res.totalUnread);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [workspaceId, userId]);

  const updateUnreadCount = useCallback((contactId: string, count: number) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [contactId]: count,
    }));

    // Recalculate total
    setUnreadCounts((prev) => {
      const newCounts = { ...prev, [contactId]: count };
      const total = Object.values(newCounts).reduce((a, b) => a + b, 0);
      setTotalUnread(total);
      return newCounts;
    });
  }, []);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  return {
    unreadCounts,
    totalUnread,
    updateUnreadCount,
    refresh: fetchUnreadCounts,
  };
}
