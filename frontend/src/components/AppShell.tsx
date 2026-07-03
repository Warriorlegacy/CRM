'use client';

import { useState } from 'react';
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Menu } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-transparent">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white md:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>
      {/* Sidebar: hidden on mobile unless open */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out md:relative md:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex min-h-screen flex-col bg-transparent">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
}
