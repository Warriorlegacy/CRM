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

      const wsUrl = `${wsHost}/realtime/events`;
      console.log('🔌 Connecting to WebSocket...', wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (!isMounted) return;
        socket?.send(JSON.stringify({ type: 'auth', token }));
        console.log('🔌 WebSocket Connected, authenticating...');
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'auth_ok') {
            setConnected(true);
            console.log('🔌 WebSocket Authenticated');
            return;
          }
          onMessageRef.current(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message data:', err);
        }
      };

      socket.onclose = (event) => {
        if (!isMounted) return;
        setConnected(false);
        if (event.code >= 4001 && event.code <= 4003) {
          console.warn('⚠️ WebSocket auth failed, not reconnecting:', event.reason);
          return;
        }
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
