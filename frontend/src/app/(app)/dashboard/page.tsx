'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  ArrowUp, 
  ArrowDown,
  Activity,
  PieChart,
  BarChart3
} from 'lucide-react';

interface Analytics {
  overview: {
    totalContacts: number;
    newContacts: number;
    totalMessages: number;
    pendingFollowups: number;
  };
  dailyMessages: { date: string; count: number }[];
  stageDistribution: { stage: string; count: number }[];
  teamPerformance: { id: string; name: string; email: string; contactsAssigned: number; messagesSent: number }[];
  recentActivity: { id: string; contactName: string; contactPhone: string; lastMessage: string; lastMessageAt: string }[];
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  followup: 'bg-yellow-500',
  negotiation: 'bg-purple-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
};

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  followup: 'Follow-up',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export default function DashboardPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadAnalytics();
  }, [USER_ID, WORKSPACE_ID, authLoading, period]);

  const loadAnalytics = async () => {
    try {
      const data = await api.get(`/analytics?period=${period}`, { headers });
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const maxMessages = analytics?.dailyMessages.reduce((max, m) => m.count > max ? m.count : max, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500">Overview of your WhatsApp CRM</p>
        </div>
        <div className="flex gap-2">
          {(['24h', '7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                period === p
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="flex items-center text-xs text-green-400">
              <ArrowUp className="w-3 h-3" />
              {analytics?.overview.newContacts || 0} new
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(analytics?.overview.totalContacts || 0)}
          </div>
          <div className="text-sm text-zinc-500">Total Contacts</div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(analytics?.overview.totalMessages || 0)}
          </div>
          <div className="text-sm text-zinc-500">Messages ({period})</div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics?.teamPerformance.reduce((sum, t) => sum + t.messagesSent, 0) || 0}
          </div>
          <div className="text-sm text-zinc-500">Team Messages</div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="flex items-center text-xs text-red-400">
              <ArrowUp className="w-3 h-3" />
              {analytics?.overview.pendingFollowups || 0} pending
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics?.overview.pendingFollowups || 0}
          </div>
          <div className="text-sm text-zinc-500">Overdue Followups</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Messages Chart */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Messages Over Time</h3>
          </div>
          <div className="h-48 flex items-end gap-1">
            {analytics?.dailyMessages.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-500/80 rounded-t hover:bg-blue-500 transition-colors"
                  style={{ height: `${(day.count / maxMessages) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                  title={`${day.count} messages`}
                />
                <span className="text-[10px] text-zinc-600">{formatDate(day.date)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Distribution */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Pipeline Distribution</h3>
          </div>
          <div className="space-y-3">
            {analytics?.stageDistribution.map((stage) => {
              const total = analytics.stageDistribution.reduce((sum, s) => sum + s.count, 0);
              const percentage = total > 0 ? (stage.count / total) * 100 : 0;
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-zinc-400">{STAGE_LABELS[stage.stage] || stage.stage}</span>
                    <span className="text-white font-medium">{stage.count}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${STAGE_COLORS[stage.stage] || 'bg-zinc-500'} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Performance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Team Performance</h3>
          </div>
          <div className="space-y-3">
            {analytics?.teamPerformance.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {member.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-white">{member.name}</div>
                    <div className="text-xs text-zinc-500">{member.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{member.messagesSent} msgs</div>
                  <div className="text-xs text-zinc-500">{member.contactsAssigned} contacts</div>
                </div>
              </div>
            ))}
            {analytics?.teamPerformance.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                No team data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Recent Conversations</h3>
          </div>
          <div className="space-y-2">
            {analytics?.recentActivity.map((conversation) => (
              <div key={conversation.id} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{conversation.contactName}</div>
                  <div className="text-xs text-zinc-500 truncate">{conversation.lastMessage}</div>
                </div>
                <div className="text-xs text-zinc-500 flex-shrink-0">
                  {formatTime(conversation.lastMessageAt)}
                </div>
              </div>
            ))}
            {analytics?.recentActivity.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                No recent conversations
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
