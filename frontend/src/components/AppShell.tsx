'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Menu, MessageSquare, LayoutDashboard, Bell, Users, BarChart3, Kanban } from 'lucide-react';

const mobileNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inbox', icon: MessageSquare, label: 'Inbox' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#030712] md:grid md:grid-cols-[260px_1fr]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 p-2.5 bg-zinc-900/90 border border-zinc-800/50 rounded-xl text-white md:hidden backdrop-blur-xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-all duration-300 ease-out md:relative md:transform-none ${
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      } md:translate-x-0 md:block`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex min-h-screen flex-col bg-transparent md:h-screen md:overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-3.5 pb-24 md:p-6 md:pb-6 touch-pan-y">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[rgba(3,7,18,0.92)] border-t border-white/[0.06] backdrop-blur-2xl safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
          {mobileNav.map((item) => {
            const isActive = pathname === item.href ||
              (item.href === '/inbox' && pathname.startsWith('/inbox'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-400 scale-105'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
