'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3, TrendingUp, Users, MessageSquare, Target, Trophy, Download,
  Calendar, Filter, ChevronDown, Loader2, ArrowUp, ArrowDown, PieChart,
  Zap, Clock, Globe, Smartphone, Instagram, FileText, Printer
} from 'lucide-react';

interface AnalyticsReport {
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

const STAGE_LABELS: Record<string, string> = {
  new: 'New Lead',
  followup: 'Follow-up',
  negotiation: 'Negotiation',
  won: 'Closed Won',
  lost: 'Closed Lost',
};

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  followup: 'bg-yellow-500',
  negotiation: 'bg-purple-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
};

export default function ReportsPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [analytics, setAnalytics] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'team' | 'export'>('overview');

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadData();
  }, [USER_ID, WORKSPACE_ID, authLoading, period]);

  const loadData = async () => {
    try {
      const data = await api.get<{ analytics: AnalyticsReport }>(`/analytics?period=${period}`, { headers });
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const handleExport = async (type: 'contacts' | 'conversations' | 'messages') => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/export/${type}/csv`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-id': USER_ID,
          'x-workspace-id': WORKSPACE_ID,
        },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const totalStage = analytics?.stageDistribution.reduce((sum, s) => sum + s.count, 0) || 0;
  const maxDaily = Math.max(...(analytics?.dailyMessagesByChannel || []).map(d => d.whatsapp + d.instagram), 1);
  const topPerformer = analytics?.teamPerformance?.length
    ? [...analytics.teamPerformance].sort((a, b) => b.messagesSent - a.messagesSent)[0]
    : null;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'pipeline' as const, label: 'Pipeline', icon: PieChart },
    { id: 'team' as const, label: 'Team', icon: Users },
    { id: 'export' as const, label: 'Export', icon: Download },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            Analytics & Reports
          </h1>
          <p className="text-zinc-500">Deep-dive performance metrics for your sales workflow</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                period === p ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-white shadow-lg'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <ArrowUp className="w-3 h-3" />
                  {analytics?.overview.newContacts || 0} new
                </span>
              </div>
              <div className="text-3xl font-bold text-white font-mono">{formatNumber(analytics?.overview.totalContacts || 0)}</div>
              <div className="text-sm text-zinc-500 mt-1">Total Contacts</div>
              <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />WA {analytics?.channelBreakdown.whatsapp.contacts || 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" />IG {analytics?.channelBreakdown.instagram.contacts || 0}</span>
              </div>
            </div>

            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white font-mono">{formatNumber(analytics?.overview.totalMessages || 0)}</div>
              <div className="text-sm text-zinc-500 mt-1">Messages ({period})</div>
              <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />WA {analytics?.channelBreakdown.whatsapp.messages || 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" />IG {analytics?.channelBreakdown.instagram.messages || 0}</span>
              </div>
            </div>

            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-500/20 rounded-xl">
                  <Target className="w-5 h-5 text-orange-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white font-mono">{analytics?.leadMetrics.hotLeads || 0}</div>
              <div className="text-sm text-zinc-500 mt-1">Hot Leads</div>
              <div className="flex items-center gap-2 mt-3 text-xs">
                <span className="text-red-400">{analytics?.leadMetrics.hotLeads || 0} hot</span>
                <span className="text-yellow-400">{analytics?.leadMetrics.warmLeads || 0} warm</span>
                <span className="text-blue-400">{analytics?.leadMetrics.coldLeads || 0} cold</span>
              </div>
            </div>

            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs text-zinc-500">avg {analytics?.leadMetrics.averageScore.toFixed(0) || 0}</span>
              </div>
              <div className="text-3xl font-bold text-white font-mono">{analytics?.leadMetrics.conversionRate || 0}%</div>
              <div className="text-sm text-zinc-500 mt-1">Conversion Rate</div>
              <div className="text-xs text-zinc-500 mt-2">
                {analytics?.leadMetrics.convertedLeads || 0} won of {analytics?.overview.totalContacts || 0} total
              </div>
            </div>
          </div>

          {/* Channel Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel-strong rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-zinc-400" />
                Messages by Channel
              </h3>
              <div className="h-48 flex items-end gap-1">
                {analytics?.dailyMessagesByChannel.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col" style={{ height: `${((day.whatsapp + day.instagram) / maxDaily) * 100}%`, minHeight: (day.whatsapp + day.instagram) > 0 ? '4px' : '0' }}>
                      <div className="w-full bg-pink-500/80 rounded-t" style={{ height: `${day.instagram / (day.whatsapp + day.instagram || 1) * 100}%` }} />
                      <div className="w-full bg-emerald-500/80" style={{ height: `${day.whatsapp / (day.whatsapp + day.instagram || 1) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-600">{formatDate(day.date)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />WhatsApp</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" />Instagram</span>
              </div>
            </div>

            <div className="glass-panel-strong rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-zinc-400" />
                Lead Temperature
              </h3>
              <div className="space-y-4">
                {[
                  { label: '🔥 Hot', count: analytics?.leadMetrics.hotLeads || 0, color: 'bg-red-500', glow: 'rgba(239,68,68,0.15)' },
                  { label: '👋 Warm', count: analytics?.leadMetrics.warmLeads || 0, color: 'bg-yellow-500', glow: 'rgba(234,179,8,0.15)' },
                  { label: '❄️ Cold', count: analytics?.leadMetrics.coldLeads || 0, color: 'bg-blue-500', glow: 'rgba(59,130,246,0.15)' },
                  { label: '🆕 New', count: analytics?.leadMetrics.frozenLeads || 0, color: 'bg-zinc-500', glow: 'rgba(113,113,122,0.15)' },
                ].map((item) => {
                  const pct = analytics?.leadMetrics.totalLeads ? (item.count / analytics.leadMetrics.totalLeads) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-zinc-400">{item.label}</span>
                        <span className="text-white font-mono font-bold">{item.count}</span>
                      </div>
                      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden" style={{ boxShadow: `inset 0 0 8px ${item.glow}` }}>
                        <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-sm">
                <span className="text-zinc-500">Average Lead Score</span>
                <span className="text-white font-mono font-bold">{analytics?.leadMetrics.averageScore.toFixed(0) || 0}/100</span>
              </div>
            </div>
          </div>

          {/* Channel Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <h3 className="font-semibold text-white">WhatsApp</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Contacts', value: analytics?.channelBreakdown.whatsapp.contacts || 0, color: 'text-emerald-400' },
                  { label: 'Messages', value: analytics?.channelBreakdown.whatsapp.messages || 0, color: 'text-emerald-400' },
                  { label: 'Conversations', value: analytics?.channelBreakdown.whatsapp.conversations || 0, color: 'text-emerald-400' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className={`text-2xl font-bold text-white font-mono ${stat.color}`}>{formatNumber(stat.value)}</div>
                    <div className="text-xs text-zinc-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-pink-400" />
                <h3 className="font-semibold text-white">Instagram</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Contacts', value: analytics?.channelBreakdown.instagram.contacts || 0, color: 'text-pink-400' },
                  { label: 'Messages', value: analytics?.channelBreakdown.instagram.messages || 0, color: 'text-pink-400' },
                  { label: 'Conversations', value: analytics?.channelBreakdown.instagram.conversations || 0, color: 'text-pink-400' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className={`text-2xl font-bold text-white font-mono ${stat.color}`}>{formatNumber(stat.value)}</div>
                    <div className="text-xs text-zinc-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chatbot + Follow-ups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel-strong rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Chatbot Performance
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-white font-mono">{analytics?.chatbotMetrics.totalFlows || 0}</div>
                  <div className="text-xs text-zinc-500">Total Flows</div>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-green-400 font-mono">{analytics?.chatbotMetrics.activeFlows || 0}</div>
                  <div className="text-xs text-zinc-500">Active</div>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-white font-mono">{formatNumber(analytics?.chatbotMetrics.completions || 0)}</div>
                  <div className="text-xs text-zinc-500">Completions</div>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-400 font-mono">{analytics?.chatbotMetrics.abandonmentRate || 0}%</div>
                  <div className="text-xs text-zinc-500">Abandon Rate</div>
                </div>
              </div>
            </div>

            <div className="glass-panel-strong rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Conversion Metrics
              </h3>
              <div className="text-center py-4">
                <div className="text-6xl font-bold text-white font-mono gradient-text">{analytics?.leadMetrics.conversionRate || 0}%</div>
                <div className="text-sm text-zinc-400 mt-2">Overall Conversion Rate</div>
                <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{analytics?.leadMetrics.convertedLeads || 0}</div>
                    <div className="text-xs text-zinc-500">Won</div>
                  </div>
                  <div className="text-zinc-700 text-2xl">/</div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{analytics?.overview.totalContacts || 0}</div>
                    <div className="text-xs text-zinc-500">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PIPELINE TAB ─── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="glass-panel-strong rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-zinc-400" />
              Sales Pipeline Distribution
            </h3>
            <div className="space-y-4">
              {analytics?.stageDistribution.map((stage) => {
                const pct = totalStage > 0 ? (stage.count / totalStage) * 100 : 0;
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${STAGE_COLORS[stage.stage] || 'bg-zinc-500'}`} />
                        <span className="text-zinc-300">{STAGE_LABELS[stage.stage] || stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-mono font-bold">{stage.count}</span>
                        <span className="text-zinc-500 text-xs w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${STAGE_COLORS[stage.stage] || 'bg-zinc-500'} rounded-full transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!analytics?.stageDistribution || analytics.stageDistribution.length === 0) && (
                <div className="text-center py-8 text-zinc-500">No pipeline data</div>
              )}
            </div>
          </div>

          {/* Funnel visualization */}
          <div className="glass-panel-strong rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-zinc-400" />
              Conversion Funnel
            </h3>
            <div className="space-y-3">
              {[
                { stage: 'New Leads', count: analytics?.stageDistribution.find(s => s.stage === 'new')?.count || 0, color: 'bg-blue-500' },
                { stage: 'Follow-up', count: analytics?.stageDistribution.find(s => s.stage === 'followup')?.count || 0, color: 'bg-yellow-500' },
                { stage: 'Negotiation', count: analytics?.stageDistribution.find(s => s.stage === 'negotiation')?.count || 0, color: 'bg-purple-500' },
                { stage: 'Closed Won', count: analytics?.stageDistribution.find(s => s.stage === 'won')?.count || 0, color: 'bg-green-500' },
              ].map((item, i) => {
                const firstCount = analytics?.stageDistribution.find(s => s.stage === 'new')?.count || 1;
                const widthPct = firstCount > 0 ? (item.count / firstCount) * 100 : 0;
                return (
                  <div key={item.stage} className="flex items-center gap-4">
                    <div className="w-28 text-sm text-zinc-400 text-right">{item.stage}</div>
                    <div className="flex-1">
                      <div className="relative h-10 flex items-center">
                        <div
                          className={`h-full ${item.color} rounded-r-xl flex items-center px-4 transition-all duration-1000 opacity-80`}
                          style={{ width: `${Math.max(widthPct, 5)}%` }}
                        >
                          <span className="text-white font-mono font-bold text-sm">{item.count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-xs text-zinc-500">
                      {i > 0 && firstCount > 0 ? `${((item.count / firstCount) * 100).toFixed(0)}%` : '100%'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TEAM TAB ─── */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="glass-panel-strong rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Team Leaderboard
              </h3>
              {topPerformer && (
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <Trophy className="w-4 h-4" />
                  Top: {topPerformer.name}
                </div>
              )}
            </div>
            {analytics?.teamPerformance && analytics.teamPerformance.length > 0 ? (
              <div className="space-y-2">
                {[...analytics.teamPerformance]
                  .sort((a, b) => b.messagesSent - a.messagesSent)
                  .map((member, i) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                        i === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                        i === 1 ? 'bg-zinc-700/30 border border-zinc-600/20' :
                        i === 2 ? 'bg-orange-500/5 border border-orange-500/10' :
                        'bg-zinc-800/20 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          i === 1 ? 'bg-zinc-600 text-zinc-300' :
                          i === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">{member.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">{member.name}</div>
                          <div className="text-xs text-zinc-500">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-lg font-bold text-white font-mono">{member.messagesSent}</div>
                          <div className="text-xs text-zinc-500">Messages</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white font-mono">{member.contactsAssigned}</div>
                          <div className="text-xs text-zinc-500">Contacts</div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          i <= Math.ceil((analytics.teamPerformance.length || 1) / 3) ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-zinc-700 text-zinc-400'
                        }`}>
                          {i === 0 ? '#1' : i <= Math.ceil((analytics.teamPerformance.length || 1) / 3) ? 'Top Tier' : 'Active'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">No team data available</div>
            )}
          </div>
        </div>
      )}

      {/* ─── EXPORT TAB ─── */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="glass-panel-strong rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Export Data
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              Download your workspace data as CSV files for use in Excel, Google Sheets, or other tools.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleExport('contacts')}
                className="p-5 bg-zinc-800/30 border border-zinc-700 rounded-2xl hover:border-emerald-500/30 hover:bg-zinc-800/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <h4 className="font-medium text-white mb-1">Export Contacts</h4>
                <p className="text-xs text-zinc-500 mb-3">Download all contacts with stage, tags, and assignment info</p>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Download className="w-3 h-3" />
                  contacts-2026-07-20.csv
                </div>
              </button>

              <button
                onClick={() => handleExport('conversations')}
                className="p-5 bg-zinc-800/30 border border-zinc-700 rounded-2xl hover:border-emerald-500/30 hover:bg-zinc-800/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <h4 className="font-medium text-white mb-1">Export Conversations</h4>
                <p className="text-xs text-zinc-500 mb-3">Download conversation history with messages and activity timestamps</p>
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <Download className="w-3 h-3" />
                  conversations-2026-07-20.csv
                </div>
              </button>

              <button
                onClick={() => handleExport('messages')}
                className="p-5 bg-zinc-800/30 border border-zinc-700 rounded-2xl hover:border-emerald-500/30 hover:bg-zinc-800/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <h4 className="font-medium text-white mb-1">Export Messages</h4>
                <p className="text-xs text-zinc-500 mb-3">Download all message data with direction, type, and sender info</p>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Download className="w-3 h-3" />
                  messages-2026-07-20.csv
                </div>
              </button>
            </div>
          </div>

          {/* Data Summary */}
          <div className="glass-panel-strong rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Data Snapshot</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Contacts', value: analytics?.overview.totalContacts || 0, icon: Users },
                { label: 'Messages', value: analytics?.overview.totalMessages || 0, icon: MessageSquare },
                { label: 'Conversations', value: (analytics?.channelBreakdown.whatsapp.conversations || 0) + (analytics?.channelBreakdown.instagram.conversations || 0), icon: MessageSquare },
                { label: 'Follow-ups', value: analytics?.overview.pendingFollowups || 0, icon: Clock },
              ].map((stat) => (
                <div key={stat.label} className="p-4 bg-zinc-800/30 rounded-xl text-center">
                  <stat.icon className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white font-mono">{formatNumber(stat.value)}</div>
                  <div className="text-xs text-zinc-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Import */}
          <div className="glass-panel-strong rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Import Contacts from CSV
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Upload a CSV file with columns: <code className="text-emerald-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">name, phone, email, stage, tags</code>
            </p>
            <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 text-center hover:border-emerald-500/40 transition-colors">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 mb-1">
                  <span className="text-emerald-400 font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-zinc-600">CSV files only</p>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
