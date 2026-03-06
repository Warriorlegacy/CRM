'use client';

import { useEffect, useState, useCallback } from 'react';

export function useRealtime(workspaceId: string, onMessage: (data: any) => void) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const evtSource = new EventSource(`${API_BASE}/realtime/events?workspaceId=${workspaceId}`);

    evtSource.onopen = () => {
      setConnected(true);
      console.log('🔌 SSE Connected');
    };

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    evtSource.onerror = () => {
      setConnected(false);
      console.warn('⚠️ SSE Disconnected, retrying...');
    };

    return () => {
      evtSource.close();
      setConnected(false);
    };
  }, [workspaceId, onMessage]);

  return { connected };
}
