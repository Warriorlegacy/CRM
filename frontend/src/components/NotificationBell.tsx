'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, MessageSquare, Clock, UserPlus, Bot, Mail, Settings, Check, CheckCheck, ChevronRight, X, Loader2, Inbox } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/hooks/useRealtime';
import { api } from '@/lib/api';
import Link from 'next/link';
import ChannelBadge from './ChannelBadge';

// ─── Types ────────────────────────────────────────────────────────
interface Notification {
  id: string;
  type: 'inbound_message' | 'outbound_message' | 'followup_due' | 'team_invite' | 'flow_execution' | 'campaign_sent' | 'system';
  title: string;
  message: string;
  channel?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

// ─── Icons & Colors ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ─── Helpers ─────────────────────────────────────────────────────
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const { workspace } = useAuth();
  const WORKSPACE_ID = workspace?.id || '';

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ─── Fetch initial notifications ──────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!WORKSPACE_ID) return;
    setLoading(true);
    try {
      const res = await api.get<NotificationsResponse>(
        '/notifications?limit=5'
      );
      // Merge with any existing notifications to avoid duplicates on reconnect
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newOnes = res.notifications.filter(
          (n) => !existingIds.has(n.id)
        );
        return [...newOnes, ...prev].slice(0, 50);
      });
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [WORKSPACE_ID]);

  useEffect(() => {
    if (!WORKSPACE_ID) return;
    fetchNotifications();
  }, [WORKSPACE_ID, fetchNotifications]);

  // ─── Real-time WebSocket subscription ─────────────────────────
  useRealtime(WORKSPACE_ID, (event) => {
    if (event.type === 'notification:new' && event.data) {
      const d = event.data as Record<string, unknown>;
      const notif: Notification = {
        id: String(d.id || ''),
        type: (String(d.type || 'system') as Notification['type']),
        title: String(d.title || ''),
        message: String(d.message || ''),
        channel: d.channel ? String(d.channel) : undefined,
        link: d.link ? String(d.link) : undefined,
        read: Boolean(d.read),
        createdAt: String(d.createdAt || new Date().toISOString()),
      };
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev].slice(0, 50);
      });
      setUnreadCount((prev) => prev + 1);
    } else if (event.type === 'notification:read') {
      const { id } = event.data as { id: string };
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } else if (event.type === 'notification:read-all') {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } else if (event.type === 'notification:deleted') {
      const { id } = event.data as { id: string };
      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === id);
        if (removed && !removed.read) setUnreadCount((u) => Math.max(0, u - 1));
        return prev.filter((n) => n.id !== id);
      });
    } else if (event.type === 'notification:cleared') {
      setNotifications([]);
      setUnreadCount(0);
    }
  });

  // ─── Click outside to close ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // ─── Actions ─────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.patch(`/notifications/${id}/read`, {});
    } catch {
      // Revert
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    const prevCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.patch('/notifications/read-all', {});
    } catch {
      setUnreadCount(prevCount);
    }
  };

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900/60 border border-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700/50 transition-all active:scale-95"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 notification-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-xl ring-1 ring-red-500/20" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] flex flex-col rounded-2xl border border-white/[0.06] bg-[rgba(3,7,18,0.96)] backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden z-[100] transition-all duration-200 dropdown-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 mb-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/30 flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-zinc-500" />
                </div>
                <p className="text-sm text-zinc-400 font-medium">All caught up!</p>
                <p className="text-xs text-zinc-600 mt-1">
                  New notifications will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {notifications.slice(0, 8).map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                  const colorClass =
                    NOTIFICATION_COLORS[notification.type] ||
                    'bg-zinc-500/20 text-zinc-400';

                  return (
                    <div
                      key={notification.id}
                      className={`group relative flex items-start gap-3 px-4 py-3 transition-all cursor-pointer ${
                        notification.read
                          ? 'hover:bg-white/[0.02]'
                          : 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]'
                      }`}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id);
                        if (notification.link) {
                          window.location.href = notification.link;
                        }
                      }}
                    >
                      {/* Unread dot */}
                      {!notification.read && (
                        <span className="absolute top-3.5 left-4 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1" />
                      )}

                      {/* Icon */}
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          notification.read ? '' : 'ml-4'
                        } ${colorClass}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-xs font-medium leading-snug ${
                              notification.read ? 'text-zinc-400' : 'text-white'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <span className="text-[10px] text-zinc-600 whitespace-nowrap shrink-0 mt-0.5">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {notification.channel && (
                            <ChannelBadge channel={notification.channel} size="sm" />
                          )}
                        </div>
                      </div>

                      {/* Read toggle */}
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="shrink-0 p-1 rounded-lg text-zinc-600 hover:text-emerald-400 hover:bg-zinc-800/60 transition-all opacity-0 group-hover:opacity-100"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - View All */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium text-zinc-400 hover:text-white border-t border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] transition-colors shrink-0"
          >
            View all notifications
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
