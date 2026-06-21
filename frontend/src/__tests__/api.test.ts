import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make GET requests correctly', async () => {
    const mockResponse = { success: true, data: { id: 1 } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { api } = await import('../lib/api');
    const result = await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should make POST requests correctly', async () => {
    const mockResponse = { success: true, data: { id: 1 } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { api } = await import('../lib/api');
    const result = await api.post('/test', { name: 'test' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ name: 'test' }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should make PATCH requests correctly', async () => {
    const mockResponse = { success: true, data: { id: 1 } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { api } = await import('../lib/api');
    const result = await api.patch('/test/1', { name: 'updated' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/test/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ name: 'updated' }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should make DELETE requests correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { api } = await import('../lib/api');
    await api.delete('/test/1');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/test/1',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('should include auth token in headers', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { api } = await import('../lib/api');
    await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
      })
    );
  });

  it('should throw error on failed response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad Request' }),
    });

    const { api } = await import('../lib/api');

    await expect(api.get('/test')).rejects.toThrow();
  });
});
