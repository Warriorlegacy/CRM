import '@testing-library/jest-dom';
import { vi } from 'vitest';

global.fetch = vi.fn();

Storage.prototype.getItem = vi.fn((key: string) => {
  const mockData: Record<string, string> = {
    auth_token: 'mock-token',
    auth_user: JSON.stringify({ id: 'user-1', name: 'Test User', email: 'test@example.com' }),
    auth_workspace: JSON.stringify({ id: 'workspace-1', name: 'Test Workspace' }),
  };
  return mockData[key] || null;
});

Storage.prototype.setItem = vi.fn();
Storage.prototype.removeItem = vi.fn();

Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
  },
  writable: true,
});

window.matchMedia = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
