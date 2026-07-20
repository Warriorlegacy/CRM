'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/hooks/useRealtime';
import {
  Bell, MessageSquare, Bot, UserPlus, Mail, Clock, Check,
  CheckCheck, Filter, Loader2, Trash2, X, Settings,
  RefreshCw, Inbox
} from 'lucide-react';
import ChannelBadge from '@/components/ChannelBadge';

interface Notification {
  id: string;
  type: 'inbound_message' | 'outbound_message' | 'followup_due' | 'team_invite' | 'flow_execution' | 'campaign_sent' | 'system';
  title: string;
  message: string;
  channel?: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

const NOTIFICATION_ICONS: Record<string, any> = {
  inbound_message: MessageSquare,
  outbound_message: CheckCheck,
  followup_due: Clock,
  team_invite: UserPlus,
  flow_execution: Bot,
  campaign_sent: Mail,
  system: Settings,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  inbound_message: 'bg-emerald-500/20 text-emerald-400',
  outbound_message: 'bg-blue-500/20 text-blue-400',
  followup_due: 'bg-amber-500/20 text-amber-400',
  team_invite: 'bg-purple-500/20 text-purple-400',
  flow_execution: 'bg-cyan-500/20 text-cyan-400',
  campaign_sent: 'bg-pink-500/20 text-pink-400',
  system: 'bg-zinc-500/20 text-zinc-400',
};

export default function NotificationsPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Load notifications from API ──────────────────────────────
  const loadNotifications = useCallback(async (append = false) => {
    if (!WORKSPACE_ID) return;

    try {
      setError(null);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      params.set('limit', '50');
      if (append) params.set('offset', String(notifications.length));

      const res = await api.get<NotificationsResponse>(`/notifications?${params.toString()}`);
      setNotifications(prev => append ? [...prev, ...res.notifications] : res.notifications);
      setUnreadCount(res.unreadCount);
      setTotalCount(res.total);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [WORKSPACE_ID, filter, typeFilter]);

  useEffect(() => {
    if (!WORKSPACE_ID || authLoading) return;
    setLoading(true);
    loadNotifications();
  }, [WORKSPACE_ID, authLoading, loadNotifications]);



  // ─── Real-time WebSocket subscription ─────────────────────────
  useRealtime(WORKSPACE_ID, (event) => {
    if (event.type === 'notification:new' && event.data && typeof event.data === 'object') {
      // Only show if it matches the current filter
      const data = event.data as Record<string, unknown>;
      const notif = {
        id: String(data.id || ''),
        type: String(data.type || 'system') as Notification['type'],
        title: String(data.title || ''),
        message: String(data.message || ''),
        channel: data.channel ? String(data.channel) : undefined,
        link: data.link ? String(data.link) : undefined,
        read: Boolean(data.read),
        createdAt: String(data.createdAt || new Date().toISOString()),
      };

      // Type guard: if filter excludes this, skip
      if (filter === 'read' && !notif.read) return;
      if (filter === 'unread' && notif.read) return;
      if (typeFilter !== 'all' && notif.type !== typeFilter) return;

      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount(prev => prev + 1);
      setTotalCount(prev => prev + 1);
    } else if (event.type === 'notification:read') {
      const { id } = event.data as { id: string };
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } else if (event.type === 'notification:read-all') {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } else if (event.type === 'notification:deleted') {
      const { id } = event.data as { id: string };
      setNotifications(prev => {
        const removed = prev.find(n => n.id === id);
        if (removed && !removed.read) setUnreadCount(u => Math.max(0, u - 1));
        return prev.filter(n => n.id !== id);
      });
      setTotalCount(prev => Math.max(0, prev - 1));
    } else if (event.type === 'notification:cleared') {
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
      setHasMore(false);
    }
  });

  // ─── Actions ─────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await api.patch(`/notifications/${id}/read`, {});
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: false } : n)
      );
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const prevUnread = unreadCount;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await api.patch('/notifications/read-all', {});
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // Revert
      loadNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.read) setUnreadCount(u => Math.max(0, u - 1));
    setTotalCount(t => Math.max(0, t - 1));

    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      loadNotifications(); // Full reload on error
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    setTotalCount(0);
    setHasMore(false);

    try {
      await api.delete('/notifications');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      loadNotifications(); // Full reload on error
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter === 'all') return true;
    return n.type === typeFilter;
  });

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="w-7 h-7 text-emerald-400" />
            Notifications
          </h1>
          <p className="text-zinc-500">
            {unreadCount > 0
              ? `${unreadCount} unread${totalCount > 0 ? ` · ${totalCount} total` : ''}`
              : totalCount > 0
                ? `${totalCount} notifications`
                : 'No notifications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); loadNotifications(); }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm hover:bg-zinc-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm hover:bg-zinc-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 rounded-xl text-sm hover:bg-red-900/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="bg-red-900/30 border border-red-800/40 rounded-2xl px-5 py-3 flex items-center justify-between">
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-400 outline-none focus:border-emerald-500/40 transition-colors"
        >
          <option value="all">All Types</option>
          <option value="inbound_message">Messages</option>
          <option value="followup_due">Follow-ups</option>
          <option value="flow_execution">Chatbot</option>
          <option value="campaign_sent">Campaigns</option>
          <option value="team_invite">Team</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="glass-panel-strong rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
              {filter === 'unread' ? (
                <CheckCheck className="w-8 h-8 text-emerald-400" />
              ) : (
                <Inbox className="w-8 h-8 text-zinc-500" />
              )}
            </div>
            <p className="text-zinc-400 text-lg font-medium">
              {filter === 'unread'
                ? 'All caught up!'
                : filter === 'read'
                  ? 'No read notifications'
                  : 'No notifications yet'}
            </p>
            <p className="text-sm text-zinc-600 mt-1">
              {filter !== 'all'
                ? 'Try changing your filters'
                : 'Notifications will appear here when new messages, follow-ups, and events happen.'}
            </p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
              const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-zinc-500/20 text-zinc-400';

              return (
                <div
                  key={notification.id}
                  className={`group relative flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer ${
                    notification.read
                      ? 'bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/50'
                      : 'bg-zinc-900 border border-emerald-900/30 hover:bg-zinc-800/50'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-emerald-400 notification-pulse" />
                  )}

                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl shrink-0 ${colorClass} ${!notification.read ? 'ml-4' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`text-sm font-medium ${notification.read ? 'text-zinc-300' : 'text-white'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {notification.channel && (
                          <ChannelBadge channel={notification.channel} />
                        )}
                        <span className="text-xs text-zinc-600 whitespace-nowrap">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 mt-2">
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View details →
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-xs text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  {/* Read/Unread toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notification.read) markAsRead(notification.id);
                    }}
                    className={`shrink-0 p-1.5 rounded-lg transition-all ${
                      notification.read
                        ? 'text-zinc-600 opacity-0 group-hover:opacity-100'
                        : 'text-emerald-400'
                    }`}
                  >
                    {notification.read ? (
                      <CheckCheck className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}

            {/* Load more */}
            {hasMore && (
              <button
                onClick={() => loadNotifications(true)}
                className="w-full py-3 text-sm text-zinc-500 hover:text-white transition-colors bg-zinc-900/30 rounded-xl border border-zinc-800/50 hover:bg-zinc-900/50"
              >
                Load more notifications
              </button>
            )}
          </>
        )}
      </div>

      {/* Summary Footer */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between text-xs text-zinc-600 pt-2">
          <span>
            Showing {filteredNotifications.length} of {totalCount} notifications
          </span>
          <div className="flex items-center gap-3">
            <span>{unreadCount} unread</span>
            <span>
              {notifications.filter((n) => n.channel === 'whatsapp').length} WhatsApp
            </span>
            <span>
              {notifications.filter((n) => n.channel === 'instagram').length} Instagram
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
