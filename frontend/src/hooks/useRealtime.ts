'use client';

import { useEffect, useState, useRef } from 'react';
import { API_ORIGIN } from '@/lib/api';

export interface RealtimeMessage {
  id: string;
  bodyText?: string | null;
  direction?: 'inbound' | 'outbound';
  type?: string;
  channel?: string;
  createdAt?: string;
  sentByUserId?: string | null;
  sentByUser?: { id: string; name: string } | null;
  readReceipts?: { userId: string; user: { id: string; name: string } }[];
  mediaUrl?: string | null;
  mediaType?: string;
  mediaMimeType?: string | null;
}

interface RealtimeEvent {
  type: string;
  conversationId?: string;
  contactId?: string;
  message?: RealtimeMessage;
  unreadCount?: number;
  userId?: string;
  userName?: string | null;
  status?: string;
  analysis?: Record<string, unknown>;
  data?: Record<string, unknown>;
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
    if (!token) return;

    const wsHost = API_ORIGIN.replace(/^http/, 'ws');

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const isServerless = wsHost.includes('vercel.app') || wsHost.includes('render.com');

      // On serverless platforms where native WebSockets are unsupported, use EventSource (SSE) or polling
      if (isServerless) {
        try {
          const sseUrl = `${API_ORIGIN}/realtime/events?token=${encodeURIComponent(token || '')}&workspaceId=${encodeURIComponent(workspaceId || '')}`;
          const eventSource = new EventSource(sseUrl);
          eventSource.onopen = () => {
            if (isMounted) setConnected(true);
          };
          eventSource.onmessage = (e) => {
            if (!isMounted) return;
            try {
              const data = JSON.parse(e.data);
              onMessageRef.current(data);
            } catch {}
          };
          eventSource.onerror = () => {
            if (isMounted) setConnected(false);
          };
          return;
        } catch {
          // Fall back gracefully
          return;
        }
      }

      const wsUrl = `${wsHost}/realtime/events`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (!isMounted) return;
        socket?.send(JSON.stringify({ type: 'auth', token }));
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'auth_ok') {
            setConnected(true);
            return;
          }
          onMessageRef.current(data);
        } catch {}
      };

      socket.onclose = (event) => {
        if (!isMounted) return;
        setConnected(false);
        if (event.code >= 4001 && event.code <= 4003) return;
        reconnectTimeout = setTimeout(connect, 10000);
      };

      socket.onerror = () => {
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
