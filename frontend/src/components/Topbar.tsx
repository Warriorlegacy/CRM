'use client';

import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Topbar() {
  const { workspace, user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[rgba(3,7,18,0.80)] px-5 py-3 backdrop-blur-2xl">
      <div className="text-sm text-zinc-500">
        Workspace: <span className="font-medium text-zinc-200">{workspace?.name || 'Your Workspace'}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            placeholder="Search contacts, messages..."
            className="w-72 rounded-xl bg-zinc-900/80 border border-zinc-800/50 pl-10 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-all duration-200 focus:border-emerald-400/30 focus:bg-zinc-900 focus:shadow-[0_0_20px_rgba(65,211,155,0.06)]"
          />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-sm font-semibold text-zinc-200 border border-zinc-700/50">
          {user?.name?.slice(0, 2).toUpperCase() || 'WA'}
        </div>
      </div>
    </header>
  );
}
