const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1`;

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

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

type RequestBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

export const api = {
  async get<T = unknown>(path: string, options?: { headers?: Record<string, string> }): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
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
    
    if (res.status === 204) return null;
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
    
    if (res.status === 204) return null;
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
    
    if (res.status === 204) return null;
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
    
    if (res.status === 204) return null;
    return res.json();
  },
};
