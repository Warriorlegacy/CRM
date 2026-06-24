'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface TypingUser {
  userId: string;
  userName: string | null;
}

export function useTypingIndicator(
  conversationId: string | null,
  workspaceId?: string,
  userId?: string
) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevConversationIdRef = useRef<string | null>(null);

  const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1`;

  // Send typing status
  const sendTypingStatus = useCallback(async (status: 'typing' | 'idle') => {
    if (!conversationId) return;

    try {
      await fetch(`${API_BASE}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'x-user-id': userId }),
          ...(workspaceId && { 'x-workspace-id': workspaceId }),
        },
        body: JSON.stringify({ conversationId, status }),
      });
    } catch (error) {
      console.error('Failed to send typing status:', error);
    }
  }, [conversationId, workspaceId, userId, API_BASE]);

  // Handle input change with debounce
  const handleInputChange = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus('typing');
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to mark as idle after 3 seconds
    const timeout = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus('idle');
    }, 3000);

    typingTimeoutRef.current = timeout;
  }, [isTyping, sendTypingStatus]);

  // Fetch typing users
  const fetchTypingUsers = useCallback(async () => {
    if (!conversationId) return;

    try {
      const res = await fetch(
        `${API_BASE}/typing/${conversationId}`,
        {
          headers: {
            ...(userId && { 'x-user-id': userId }),
            ...(workspaceId && { 'x-workspace-id': workspaceId }),
          },
        }
      );
      const data = await res.json();
      if (data.ok) {
        // Filter out current user
        setTypingUsers(data.typingUsers.filter((u: TypingUser) => u.userId !== userId));
      }
    } catch (error) {
      console.error('Failed to fetch typing users:', error);
    }
  }, [conversationId, workspaceId, userId, API_BASE]);

  // Poll typing status every 2 seconds
  useEffect(() => {
    // Reset typing users when conversation changes
    if (prevConversationIdRef.current && prevConversationIdRef.current !== conversationId) {
      setTypingUsers([]);
    }
    prevConversationIdRef.current = conversationId;

    if (!conversationId) {
      return;
    }

    fetchTypingUsers();
    const interval = setInterval(fetchTypingUsers, 2000);

    return () => {
      clearInterval(interval);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, fetchTypingUsers]);

  return {
    typingUsers,
    isTyping,
    sendTyping: handleInputChange,
  };
}
