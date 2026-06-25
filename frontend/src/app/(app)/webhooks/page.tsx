'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Webhook, Trash2, RefreshCw, Check, X, AlertCircle } from 'lucide-react';

interface WebhookLog {
  id: string;
  type: string;
  payload: string;
  status: string;
  error: string | null;
  createdAt: string;
}

export default function WebhooksLogPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (authLoading) return;
    loadLogs();
  }, [authLoading, filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const query = filter !== 'all' ? `?type=${filter}` : '';
      const data = await api.get<{ logs: WebhookLog[] }>(`/webhooks-log${query}`);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load webhook logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Clear all webhook logs?')) return;
    try {
      await api.delete('/webhooks-log/clear', { headers });
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') {
      return <Check className="w-4 h-4 text-green-400" />;
    }
    return <X className="w-4 h-4 text-red-400" />;
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhook Logs</h1>
          <p className="text-zinc-500">Debug WhatsApp webhook events</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400" />
          </button>
          <button
            onClick={handleClearLogs}
            className="p-2 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'messages', 'statuses', 'errors'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              filter === f
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-zinc-800">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Webhook className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              No webhook logs yet
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-zinc-800/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="font-medium text-white">{log.type}</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                {log.error && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {log.error}
                    </div>
                  </div>
                )}
                {log.payload && (
                  <details className="mt-2">
                    <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
                      View payload
                    </summary>
                    <pre className="mt-2 p-3 bg-zinc-950 rounded-lg text-xs text-zinc-400 overflow-x-auto">
                      {JSON.stringify(JSON.parse(log.payload), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
