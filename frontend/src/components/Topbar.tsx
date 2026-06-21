'use client';

import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Topbar() {
  const { workspace, user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-[rgba(6,12,23,0.72)] px-5 py-3 backdrop-blur-xl">
      <div className="text-sm text-zinc-400">
        Workspace: <span className="font-medium text-zinc-200">{workspace?.name || 'Your Workspace'}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            placeholder="Search contact / phone..."
            className="w-72 rounded-xl bg-zinc-900 border border-zinc-800 pl-10 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
          {user?.name?.slice(0, 2).toUpperCase() || 'WA'}
        </div>
      </div>
    </header>
  );
}
