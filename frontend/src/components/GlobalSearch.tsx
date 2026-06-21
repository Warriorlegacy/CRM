'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, MessageSquare, User, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ContactSearchResult {
  id: string;
  name?: string;
  phone?: string;
  stage?: string;
}

interface MessageSearchResult {
  id: string;
  contactName?: string;
  preview?: string;
  createdAt: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ messages: MessageSearchResult[]; contacts: ContactSearchResult[] }>({
    messages: [],
    contacts: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, workspace } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim() || !workspace?.id) {
      setResults({ messages: [], contacts: [] });
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const data = await api.get<{ results: { messages: MessageSearchResult[]; contacts: ContactSearchResult[] } }>(
          `/search/global?q=${encodeURIComponent(query)}&limit=10`,
          {
            headers: {
              'x-user-id': user?.id || '',
              'x-workspace-id': workspace?.id || '',
            },
          }
        );
        setResults(data.results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, user?.id, workspace?.id]);

  const handleResultClick = (result: { id: string; type: 'contact' | 'message' }) => {
    if (result.type === 'contact') {
      router.push(`/inbox?contact=${result.id}`);
    } else {
      router.push(`/inbox`);
    }
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  const hasResults = results.messages.length > 0 || results.contacts.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-24 z-50" onClick={() => setIsOpen(false)}>
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search messages, contacts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none text-lg placeholder-zinc-500"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-zinc-800 rounded"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-zinc-500">
              Searching...
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="p-8 text-center text-zinc-500">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!loading && results.contacts.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase">
                Contacts
              </div>
              {results.contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleResultClick({ ...contact, type: 'contact' })}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-white">{contact.name || contact.phone}</div>
                    {contact.stage && (
                      <div className="text-xs text-zinc-500">{contact.stage}</div>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600" />
                </button>
              ))}
            </div>
          )}

          {!loading && results.messages.length > 0 && (
            <div className="p-2 border-t border-zinc-800">
              <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase">
                Messages
              </div>
              {results.messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleResultClick({ ...msg, type: 'message' })}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-white">{msg.contactName}</div>
                    <div className="text-xs text-zinc-500 truncate">{msg.preview}</div>
                  </div>
                  <div className="text-xs text-zinc-600">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↵</kbd> to select</span>
              <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↑↓</kbd> to navigate</span>
            </div>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
