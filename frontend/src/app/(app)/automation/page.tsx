'use client';

import { useState, useEffect } from 'react';
import { 
  Bot, Zap, MessageSquare, Users, BarChart3, Plus, 
  Loader2, Check, X, TrendingUp, Clock, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { api } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: string;
}

interface AutomationStats {
  stats: {
    totalAutoReplies: number;
    activeFlows: number;
    totalExecutions: number;
    categories: Record<string, number>;
  };
  recentLogs: any[];
}

export default function AutomationPage() {
  const { addNotification } = useNotification();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesRes, statsRes] = await Promise.all([
        api.get<{ templates: Template[] }>('/automation/templates'),
        api.get<AutomationStats>('/automation/stats'),
      ]);
      setTemplates(templatesRes.templates);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    setCreating(templateId);
    try {
      await api.post(`/automation/templates/${templateId}/use`, {});
      addNotification({ type: 'success', title: 'Chatbot flow created', message: 'Go to Chatbot page to customize it.' });
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Failed to create flow', message: error.message || 'Unknown error' });
    } finally {
      setCreating(null);
    }
  };

  const categoryColors: Record<string, string> = {
    support: 'bg-blue-500/20 text-blue-400',
    sales: 'bg-emerald-500/20 text-emerald-400',
    billing: 'bg-yellow-500/20 text-yellow-400',
    complaint: 'bg-red-500/20 text-red-400',
    inquiry: 'bg-purple-500/20 text-purple-400',
    general: 'bg-zinc-500/20 text-zinc-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Automation</h1>
        <p className="text-zinc-500">Automate your conversations with AI-powered responses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats?.stats.totalAutoReplies || 0}</div>
              <div className="text-xs text-zinc-500">Auto-Replies Sent</div>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats?.stats.activeFlows || 0}</div>
              <div className="text-xs text-zinc-500">Active Chatbots</div>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats?.stats.totalExecutions || 0}</div>
              <div className="text-xs text-zinc-500">Flow Executions</div>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {Object.keys(stats?.stats.categories || {}).length}
              </div>
              <div className="text-xs text-zinc-500">Categories Detected</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">AI-Powered Features</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-medium text-white">Auto-Categorize</h3>
            <p className="text-xs text-zinc-500 mt-1">Every message is categorized as support, sales, billing, complaint, or inquiry.</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-white">Smart Auto-Reply</h3>
            <p className="text-xs text-zinc-500 mt-1">AI automatically replies to common questions, freeing up your team.</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-white">Auto-Assign</h3>
            <p className="text-xs text-zinc-500 mt-1">Leads are automatically assigned to team members based on workload.</p>
          </div>
        </div>
      </div>

      {/* Chatbot Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Chatbot Templates</h2>
          <p className="text-sm text-zinc-500">One-click to deploy pre-built automation flows</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[template.category] || 'bg-zinc-700 text-zinc-400'}`}>
                  {template.category}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">{template.name}</h3>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{template.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-600">Trigger: {template.trigger}</span>
                <button
                  onClick={() => handleUseTemplate(template.id)}
                  disabled={creating === template.id}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                >
                  {creating === template.id ? (
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                  ) : (
                    <><Plus className="w-3 h-3 inline mr-1" /> Use Template</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recentLogs && stats.recentLogs.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent AI Activity</h2>
          <div className="space-y-3">
            {stats.recentLogs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-xl">
                <div className={`w-2 h-2 rounded-full ${log.wasSent ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{log.aiReply}</div>
                  <div className="text-xs text-zinc-500 truncate">Incoming: {log.incomingMessage}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-zinc-400">{log.provider}</div>
                  <div className="text-xs text-zinc-600">{log.latencyMs}ms</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
