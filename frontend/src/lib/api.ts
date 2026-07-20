function normalizeApiBase(rawUrl?: string): string {
  const baseUrl = (rawUrl || 'http://localhost:3001').replace(/\/+$/, '');
  return /\/api\/v1$/.test(baseUrl) ? baseUrl : `${baseUrl}/api/v1`;
}

export const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
export const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, '');

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

// Get default headers with auth
function getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...customHeaders,
  };
}

export function getAuthHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  return getHeaders(customHeaders);
}

export async function establishOAuthContext(channel: 'whatsapp' | 'instagram'): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/oauth/establish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel }),
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to establish OAuth context');
  }
}

export function buildOAuthUrl(channel: 'whatsapp' | 'instagram'): string {
  const token = getAuthToken();
  return `${API_ORIGIN}/api/v1/oauth/${channel}?token=${encodeURIComponent(token || '')}`;
}

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

function getStringField(value: unknown, field: string): string | undefined {
  if (!value || typeof value !== 'object' || !(field in value)) return undefined;
  const maybeValue = (value as Record<string, unknown>)[field];
  return typeof maybeValue === 'string' ? maybeValue : undefined;
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  const data = getStringField(error, 'data');
  if (data) return data;

  if (error && typeof error === 'object' && 'data' in error) {
    const apiData = (error as { data?: unknown }).data;
    const message = getStringField(apiData, 'message') || getStringField(apiData, 'error');
    if (message) return message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

type RequestBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

export const api = {
  async get<T = unknown>(path: string, options?: { headers?: Record<string, string> }): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: getHeaders(options?.headers),
    });
    
    if (!res.ok) {
      const error: ApiError = new Error(`API Error: ${res.status}`);
      error.status = res.status;
      
      // Handle 401 - redirect to login
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_workspace');
          window.location.href = '/login';
        }
      }
      
      try {
        error.data = await res.json();
      } catch {
        error.data = await res.text();
      }
      throw error;
    }
    
    if (res.status === 204) return null as T;
    return res.json();
  },

  async post<T = unknown>(path: string, body: RequestBody, options?: { headers?: Record<string, string> }): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: getHeaders(options?.headers),
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const error: ApiError = new Error(`API Error: ${res.status}`);
      error.status = res.status;
      
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_workspace');
        window.location.href = '/login';
      }
      
      try {
        error.data = await res.json();
      } catch {
        error.data = await res.text();
      }
      throw error;
    }
    
    if (res.status === 204) return null as unknown as T;
    return res.json();
  },

  async patch<T = unknown>(path: string, body: RequestBody, options?: { headers?: Record<string, string> }): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: getHeaders(options?.headers),
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const error: ApiError = new Error(`API Error: ${res.status}`);
      error.status = res.status;
      
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_workspace');
        window.location.href = '/login';
      }
      
      try {
        error.data = await res.json();
      } catch {
        error.data = await res.text();
      }
      throw error;
    }
    
    if (res.status === 204) return null as unknown as T;
    return res.json();
  },

  async put<T = unknown>(path: string, body: RequestBody, options?: { headers?: Record<string, string> }): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: getHeaders(options?.headers),
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const error: ApiError = new Error(`API Error: ${res.status}`);
      error.status = res.status;
      
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_workspace');
        window.location.href = '/login';
      }
      
      try {
        error.data = await res.json();
      } catch {
        error.data = await res.text();
      }
      throw error;
    }
    
    if (res.status === 204) return null as unknown as T;
    return res.json();
  },

  async delete(path: string, options?: { headers?: Record<string, string> }) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: getHeaders(options?.headers),
    });
    
    if (!res.ok) {
      const error: ApiError = new Error(`API Error: ${res.status}`);
      error.status = res.status;
      
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_workspace');
        window.location.href = '/login';
      }
      
      try {
        error.data = await res.json();
      } catch {
        error.data = await res.text();
      }
      throw error;
    }
    
    if (res.status === 204) return null as unknown;
    return res.json();
  },
};
