'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      
      if (event.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const DEFAULT_SHORTCUTS = (navigate: (path: string) => void): KeyboardShortcut[] => [
  {
    key: '1',
    action: () => navigate('/dashboard'),
    description: 'Go to Dashboard',
  },
  {
    key: '2',
    action: () => navigate('/inbox'),
    description: 'Go to Inbox',
  },
  {
    key: '3',
    action: () => navigate('/contacts'),
    description: 'Go to Contacts',
  },
  {
    key: '4',
    action: () => navigate('/pipeline'),
    description: 'Go to Pipeline',
  },
  {
    key: '5',
    action: () => navigate('/followups'),
    description: 'Go to Follow-ups',
  },
  {
    key: '6',
    action: () => navigate('/templates'),
    description: 'Go to Templates',
  },
  {
    key: '7',
    action: () => navigate('/team'),
    description: 'Go to Team',
  },
  {
    key: '8',
    action: () => navigate('/settings'),
    description: 'Go to Settings',
  },
  {
    key: 'n',
    ctrl: true,
    action: () => {
      const event = new CustomEvent('openNewContact');
      window.dispatchEvent(event);
    },
    description: 'New Contact',
  },
  {
    key: '/',
    action: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    description: 'Focus Search',
  },
  {
    key: '?',
    shift: true,
    action: () => {
      const event = new CustomEvent('showShortcuts');
      window.dispatchEvent(event);
    },
    description: 'Show Keyboard Shortcuts',
  },
];
