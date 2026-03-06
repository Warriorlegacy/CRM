'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Users, Kanban, Bell, FileText, Settings, UserPlus, LayoutDashboard } from "lucide-react";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import NotificationBadge from "./NotificationBadge";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: MessageSquare },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: Kanban },
  { label: "Follow-ups", href: "/followups", icon: Bell },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Team", href: "/team", icon: UserPlus },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { totalUnread } = useUnreadCounts();

  return (
    <aside className="border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col h-screen">
      <div className="mb-6">
        <div className="text-lg font-semibold text-white">WhatsApp CRM</div>
        <div className="text-xs text-zinc-500">MVP Dashboard</div>
      </div>

      <nav className="flex-1 space-y-1">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.href === "/inbox" && totalUnread > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors relative ${
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {showBadge && (
                <NotificationBadge count={totalUnread} />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="text-sm font-medium text-white">Connected</div>
        <div className="text-xs text-zinc-500 mt-1">
          WhatsApp Cloud API (demo)
        </div>
        <button className="mt-3 w-full rounded-xl bg-white text-black py-2 text-sm font-medium hover:bg-zinc-100 transition-colors">
          Upgrade Plan
        </button>
      </div>
    </aside>
  );
}
