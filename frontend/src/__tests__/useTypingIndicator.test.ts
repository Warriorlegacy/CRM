import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useTypingIndicator Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have correct initial state', async () => {
    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator('conv-123'));

    expect(result.current.typingUsers).toEqual([]);
    expect(result.current.isTyping).toBe(false);
  });

  it('should set typing status when handleInputChange is called', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator('conv-123'));

    result.current.sendTyping();

    expect(result.current.isTyping).toBe(true);
  });

  it('should debounce typing status', async () => {
    const fetchMock = global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator('conv-123'));

    result.current.sendTyping();
    result.current.sendTyping();
    result.current.sendTyping();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should not send typing status when conversationId is null', async () => {
    const fetchMock = global.fetch = vi.fn();

    const { useTypingIndicator } = await import('../hooks/useTypingIndicator');
    
    const { result } = renderHook(() => useTypingIndicator(null));

    result.current.sendTyping();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
