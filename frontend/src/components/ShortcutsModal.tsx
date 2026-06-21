'use client';

import { useEffect, useState } from 'react';
import { X, Command } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { key: '1', description: 'Go to Dashboard' },
  { key: '2', description: 'Go to Inbox' },
  { key: '3', description: 'Go to Contacts' },
  { key: '4', description: 'Go to Pipeline' },
  { key: '5', description: 'Go to Follow-ups' },
  { key: '6', description: 'Go to Templates' },
  { key: '7', description: 'Go to Team' },
  { key: '8', description: 'Go to Settings' },
  { key: 'Ctrl + N', description: 'New Contact' },
  { key: '/', description: 'Focus Search' },
  { key: '? + Shift', description: 'Show Shortcuts' },
  { key: 'Esc', description: 'Close Modal' },
];

export default function ShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => setIsOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('showShortcuts', handleShowShortcuts);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('showShortcuts', handleShowShortcuts);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/50"
            >
              <span className="text-sm text-zinc-300">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400 font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
