'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, MessageSquare, Bot, Zap, Loader2 } from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function OnboardingPage() {
  const [status, setStatus] = useState<{ wa: boolean; ig: boolean; ai: boolean } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/oauth/status`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setStatus({ wa: d.whatsapp?.connected, ig: d.instagram?.connected, ai: false }))
      .catch(() => setStatus({ wa: false, ig: false, ai: false }));
  }, []);

  const steps = [
    { key: 'wa' as const, label: 'Connect WhatsApp', done: status?.wa || false, icon: MessageSquare, href: '/setup' },
    { key: 'ig' as const, label: 'Connect Instagram', done: status?.ig || false, icon: MessageSquare, href: '/setup' },
    { key: 'ai' as const, label: 'Add AI provider', done: status?.ai || false, icon: Bot, href: '/setup' },
    { key: 'done' as const, label: 'Start using the inbox', done: false, icon: Zap, href: '/inbox' },
  ];

  const doneCount = steps.filter(s => s.done).length;

  if (!status) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10">
          <Zap className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-semibold text-white">Welcome to WhatsApp CRM</h1>
        <p className="mt-2 text-emerald-400 text-sm font-medium">
          ⚡ 1-Click Zero Config Setup — No technical knowledge required
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {doneCount}/3 channels connected
        </p>
      </div>

      <div className="space-y-3">
        {steps.slice(0, 3).map((s) => (
          <Link key={s.key} href={s.href}
            className={`flex items-center gap-4 rounded-2xl border p-5 transition ${
              s.done
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            {s.done
              ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
              : <Circle className="h-6 w-6 shrink-0 text-zinc-600" />
            }
            <s.icon className="h-5 w-5 shrink-0 text-zinc-400" />
            <span className="flex-1 text-sm font-medium text-zinc-200">{s.label}</span>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
          </Link>
        ))}

        <Link href="/inbox"
          className={`flex items-center gap-4 rounded-2xl border p-5 transition ${
            doneCount > 0
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
          }`}
        >
          <Zap className="h-5 w-5 shrink-0 text-zinc-400" />
          <span className="flex-1 text-sm font-medium text-zinc-200">Go to inbox</span>
          <ArrowRight className="h-4 w-4 text-zinc-500" />
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-zinc-600">
        Connect at least one channel to start receiving messages.
      </p>
    </div>
  );
}
