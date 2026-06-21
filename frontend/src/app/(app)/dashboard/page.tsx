'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, MessageSquare, TrendingUp, Clock, ArrowUp, ArrowDown,
  Activity, PieChart, BarChart3, Instagram, Zap, Target, Thermometer
} from 'lucide-react';
import ChannelBadge from '@/components/ChannelBadge';

interface Analytics {
  overview: {
    totalContacts: number;
    newContacts: number;
    totalMessages: number;
    pendingFollowups: number;
  };
  channelBreakdown: {
    whatsapp: { contacts: number; messages: number; conversations: number };
    instagram: { contacts: number; messages: number; conversations: number };
  };
  dailyMessages: { date: string; count: number }[];
  dailyMessagesByChannel: { date: string; whatsapp: number; instagram: number }[];
  stageDistribution: { stage: string; count: number }[];
  teamPerformance: { id: string; name: string; email: string; contactsAssigned: number; messagesSent: number }[];
  leadMetrics: {
    totalLeads: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    frozenLeads: number;
    averageScore: number;
    convertedLeads: number;
    conversionRate: number;
  };
  chatbotMetrics: {
    totalFlows: number;
    activeFlows: number;
    completions: number;
    abandonments: number;
    abandonmentRate: string;
  };
  recentActivity: { id: string; contactName: string; contactPhone: string; channel: string; lastMessage: string; lastMessageAt: string }[];
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
      const data = await api.get<{ analytics: Analytics }>(`/analytics?period=${period}`, { headers });
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
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const maxDailyMsg = Math.max(...(analytics?.dailyMessagesByChannel || []).map(d => d.whatsapp + d.instagram), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500">Multi-channel CRM analytics</p>
        </div>
        <div className="flex gap-2">
          {(['24h', '7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${period === p
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="text-2xl font-bold text-white font-mono">
            {formatNumber(analytics?.overview.totalContacts || 0)}
          </div>
          <div className="text-sm text-zinc-500">Total Contacts</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />WA {analytics?.channelBreakdown.whatsapp.contacts || 0}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" />IG {analytics?.channelBreakdown.instagram.contacts || 0}</span>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatNumber(analytics?.overview.totalMessages || 0)}
          </div>
          <div className="text-sm text-zinc-500">Messages ({period})</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />WA {analytics?.channelBreakdown.whatsapp.messages || 0}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" />IG {analytics?.channelBreakdown.instagram.messages || 0}</span>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Thermometer className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-xs text-zinc-500">
              avg {analytics?.leadMetrics.averageScore.toFixed(0) || 0}
            </span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {analytics?.leadMetrics.hotLeads || 0}
          </div>
          <div className="text-sm text-zinc-500">Hot Leads</div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-red-400">{analytics?.leadMetrics.hotLeads || 0} hot</span>
            <span className="text-yellow-400">{analytics?.leadMetrics.warmLeads || 0} warm</span>
            <span className="text-blue-400">{analytics?.leadMetrics.coldLeads || 0} cold</span>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {analytics?.chatbotMetrics.completions || 0}
          </div>
          <div className="text-sm text-zinc-500">Bot Completions</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
            <span>{analytics?.chatbotMetrics.activeFlows || 0} active flows</span>
            <span>{analytics?.chatbotMetrics.abandonmentRate || 0}% abandon</span>
          </div>
        </div>
      </div>

      {/* Channel Comparison Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <h3 className="font-semibold text-white">WhatsApp</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xl font-bold text-white font-mono">{analytics?.channelBreakdown.whatsapp.contacts || 0}</div>
              <div className="text-xs text-zinc-500">Contacts</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono">{analytics?.channelBreakdown.whatsapp.messages || 0}</div>
              <div className="text-xs text-zinc-500">Messages</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono">{analytics?.channelBreakdown.whatsapp.conversations || 0}</div>
              <div className="text-xs text-zinc-500">Conversations</div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-pink-400" />
            <h3 className="font-semibold text-white">Instagram</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xl font-bold text-white font-mono">{analytics?.channelBreakdown.instagram.contacts || 0}</div>
              <div className="text-xs text-zinc-500">Contacts</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono">{analytics?.channelBreakdown.instagram.messages || 0}</div>
              <div className="text-xs text-zinc-500">Messages</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono">{analytics?.channelBreakdown.instagram.conversations || 0}</div>
              <div className="text-xs text-zinc-500">Conversations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Messages Chart */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Messages by Channel</h3>
          </div>
          <div className="h-48 flex items-end gap-1">
            {analytics?.dailyMessagesByChannel.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col" style={{ height: `${((day.whatsapp + day.instagram) / maxDailyMsg) * 100}%`, minHeight: (day.whatsapp + day.instagram) > 0 ? '4px' : '0' }}>
                  <div
                    className="w-full bg-pink-500/80 rounded-t"
                    style={{ height: `${day.instagram / (day.whatsapp + day.instagram || 1) * 100}%` }}
                    title={`${day.instagram} IG messages`}
                  />
                  <div
                    className="w-full bg-emerald-500/80"
                    style={{ height: `${day.whatsapp / (day.whatsapp + day.instagram || 1) * 100}%` }}
                    title={`${day.whatsapp} WA messages`}
                  />
                </div>
                <span className="text-[10px] text-zinc-600">{formatDate(day.date)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />WhatsApp</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" />Instagram</span>
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
                    <span className="text-white font-medium font-mono">{stage.count}</span>
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
                  <div className="text-sm font-medium text-white font-mono">{member.messagesSent} msgs</div>
                  <div className="text-xs text-zinc-500">{member.contactsAssigned} contacts</div>
                </div>
              </div>
            ))}
            {analytics?.teamPerformance.length === 0 && (
              <div className="text-center py-8 text-zinc-500">No team data available</div>
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
                <div className="flex-shrink-0">
                  <ChannelBadge channel={conversation.channel} />
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
              <div className="text-center py-8 text-zinc-500">No recent conversations</div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Metrics & Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Lead Temperature</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Very Hot', count: analytics?.leadMetrics.hotLeads || 0, color: 'bg-red-500' },
              { label: 'Warm', count: analytics?.leadMetrics.warmLeads || 0, color: 'bg-yellow-500' },
              { label: 'Cold', count: analytics?.leadMetrics.coldLeads || 0, color: 'bg-blue-500' },
              { label: 'New', count: analytics?.leadMetrics.frozenLeads || 0, color: 'bg-zinc-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="text-white font-mono">{item.count}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${analytics?.leadMetrics.totalLeads ? (item.count / analytics.leadMetrics.totalLeads) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Conversion</h3>
          </div>
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-white font-mono">{analytics?.leadMetrics.conversionRate || 0}%</div>
            <div className="text-sm text-zinc-500 mt-2">Won / Total</div>
            <div className="text-xs text-zinc-600 mt-1">{analytics?.leadMetrics.convertedLeads || 0} of {analytics?.overview.totalContacts || 0} contacts</div>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Chatbot Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Total Flows</span>
              <span className="text-white font-mono">{analytics?.chatbotMetrics.totalFlows || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Active Flows</span>
              <span className="text-green-400 font-mono">{analytics?.chatbotMetrics.activeFlows || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Completions</span>
              <span className="text-white font-mono">{analytics?.chatbotMetrics.completions || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Abandon Rate</span>
              <span className="text-yellow-400 font-mono">{analytics?.chatbotMetrics.abandonmentRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
