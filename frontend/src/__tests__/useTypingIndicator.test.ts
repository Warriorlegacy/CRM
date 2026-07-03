import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type FetchCall = [RequestInfo | URL, RequestInit?];
type MockedFetch = typeof fetch & {
  mock: {
    calls: FetchCall[];
  };
};

function fetchCalls(): FetchCall[] {
  return (global.fetch as MockedFetch).mock.calls;
}

function isTypingStatusCall(call: FetchCall, status: 'typing' | 'idle'): boolean {
  const init = call[1];
  if (init?.method !== 'POST' || typeof init.body !== 'string') return false;
  const body = JSON.parse(init.body) as { status?: string };
  return body.status === status;
}

async function flushHookEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useTypingIndicator Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn((url: RequestInfo | URL) => {
      if (String(url).includes('/typing/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, typingUsers: [] }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should have correct initial state', async () => {
    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator('conv-123'));
    await flushHookEffects();

    expect(result.current.typingUsers).toEqual([]);
    expect(result.current.isTyping).toBe(false);
  });

  it('should set typing status when handleInputChange is called', async () => {
    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator('conv-123'));
    await flushHookEffects();

    act(() => {
      result.current.sendTyping();
    });

    expect(result.current.isTyping).toBe(true);
  });

  it('should debounce typing status', async () => {
    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator('conv-123'));
    await flushHookEffects();

    act(() => {
      result.current.sendTyping();
    });
    act(() => {
      result.current.sendTyping();
    });
    act(() => {
      result.current.sendTyping();
    });

    const postCalls = fetchCalls().filter((call) => isTypingStatusCall(call, 'typing'));
    expect(postCalls.length).toBe(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const idleCalls = fetchCalls().filter((call) => isTypingStatusCall(call, 'idle'));
    expect(idleCalls.length).toBe(1);
  });

  it('should not send typing status when conversationId is null', async () => {
    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator(null));
    await flushHookEffects();

    act(() => {
      result.current.sendTyping();
    });

    const postCalls = fetchCalls().filter((call) => call[1]?.method === 'POST');
    expect(postCalls.length).toBe(0);
  });
});
