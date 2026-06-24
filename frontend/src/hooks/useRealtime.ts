'use client';

import { useEffect, useState, useRef } from 'react';

interface RealtimeEvent {
  type: string;
  data: Record<string, unknown>;
}

export function useRealtime(workspaceId: string, onMessage: (data: RealtimeEvent) => void) {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!workspaceId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiBase = rawBase.replace(/\/api\/v1\/?$/, '');
    const wsHost = apiBase.replace(/^http/, 'ws');

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const wsUrl = `${wsHost}/realtime/events?workspaceId=${workspaceId}${token ? `&token=${token}` : ''}`;
      console.log('🔌 Connecting to WebSocket...', wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (!isMounted) return;
        setConnected(true);
        console.log('🔌 WebSocket Connected');
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message data:', err);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        setConnected(false);
        console.warn('⚠️ WebSocket Disconnected, retrying in 3 seconds...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket?.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      setConnected(false);
    };
  }, [workspaceId]);

  return { connected };
}
