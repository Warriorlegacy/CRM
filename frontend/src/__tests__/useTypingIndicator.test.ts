import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useTypingIndicator Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockImplementation((url, init) => {
      if (url.includes('/typing/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, typingUsers: [] }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should have correct initial state', async () => {
    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator('conv-123'));

    expect(result.current.typingUsers).toEqual([]);
    expect(result.current.isTyping).toBe(false);
  });

  it('should set typing status when handleInputChange is called', async () => {
    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator('conv-123'));

    act(() => {
      result.current.sendTyping();
    });

    expect(result.current.isTyping).toBe(true);
  });

  it('should debounce typing status', async () => {
    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator('conv-123'));

    act(() => {
      result.current.sendTyping();
    });
    act(() => {
      result.current.sendTyping();
    });
    act(() => {
      result.current.sendTyping();
    });

    const postCalls = (global.fetch as any).mock.calls.filter((call: any) => 
      call[1]?.method === 'POST' && JSON.parse(call[1].body).status === 'typing'
    );
    expect(postCalls.length).toBe(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const idleCalls = (global.fetch as any).mock.calls.filter((call: any) => 
      call[1]?.method === 'POST' && JSON.parse(call[1].body).status === 'idle'
    );
    expect(idleCalls.length).toBe(1);
  });

  it('should not send typing status when conversationId is null', async () => {
    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator(null));

    act(() => {
      result.current.sendTyping();
    });

    const postCalls = (global.fetch as any).mock.calls.filter((call: any) => 
      call[1]?.method === 'POST'
    );
    expect(postCalls.length).toBe(0);
  });
});
