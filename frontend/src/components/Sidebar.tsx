'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Users, Kanban, Bell, FileText, Settings, UserPlus, LayoutDashboard, ChevronDown, LogOut, Building2, Webhook, Bot, Brain, Plug, Mail, BarChart3, BookOpen, Database, Clock, Zap } from "lucide-react";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBadge from "./NotificationBadge";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: MessageSquare },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: Kanban },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Follow-ups", href: "/followups", icon: Clock },
  { label: "Chatbot", href: "/chatbot", icon: Bot },
  { label: "AI", href: "/ai", icon: Brain },
  { label: "Automation", href: "/automation", icon: Zap },
  { label: "Email", href: "/email-automation", icon: Mail },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Team", href: "/team", icon: UserPlus },
  { label: "Import/Export", href: "/import-export", icon: Database },
  { label: "Help", href: "/help", icon: BookOpen },
  { label: "Setup", href: "/setup", icon: Plug },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Webhooks", href: "/webhooks", icon: Webhook },
];

export default function Sidebar({ onClose }: { onClose?: () => void } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, workspace, logout } = useAuth();
  const { totalUnread } = useUnreadCounts(workspace?.id, user?.id);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col h-screen">
      <div className="mb-6">
        <div className="text-lg font-semibold text-white">Signhify CRM</div>
        <div className="text-xs text-zinc-500">Revenue Workspace</div>
      </div>

      <nav className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.href === "/inbox" && totalUnread > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors relative ${
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {showBadge && (
                <NotificationBadge count={totalUnread} />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 space-y-2 shrink-0 border-t border-zinc-800/60 pt-3">
        <button 
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-white truncate">{workspace?.name || 'Select Workspace'}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </button>

        {showWorkspaceMenu && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2">
            <div className="text-xs text-zinc-500 px-2 py-1">Switch Workspace</div>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-white hover:bg-zinc-800">
              <Building2 className="w-4 h-4" />
              {workspace?.name}
            </button>
          </div>
        )}

        <button 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-xs font-medium text-emerald-400">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm text-white truncate">{user?.name || 'User'}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </button>

        {showUserMenu && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2">
            <div className="text-xs text-zinc-500 px-2 py-1">{user?.email}</div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-red-400 hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-medium text-white">WhatsApp</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-pink-400" />
          <span className="text-sm font-medium text-white">Instagram</span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Unified inbox, chatbot flows, and mini CRM
        </div>
      </div>
    </aside>
  );
}
