'use client';

import { Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-5 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="text-sm text-zinc-400">
        Workspace: <span className="text-zinc-200 font-medium">Demo Workspace</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            placeholder="Search contact / phone..."
            className="w-72 rounded-xl bg-zinc-900 border border-zinc-800 pl-10 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
        <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm text-zinc-300 font-medium">
          PS
        </div>
      </div>
    </header>
  );
}
