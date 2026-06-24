'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/inbox');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-panel hidden rounded-[32px] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-sky-100/80">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Customer conversations, finally under control
            </div>
            <h1 className="mt-8 max-w-md text-5xl font-semibold leading-tight text-white">
              Welcome back to the workspace that keeps revenue moving.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
              Track owners, follow-ups, unread conversations, and next actions without chasing updates across chats and spreadsheets.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
                Secure team access
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                JWT-based auth and role-aware workspaces keep account access production-friendly.
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-sky-300">
                <MessageSquare className="h-5 w-5" />
                Faster replies, cleaner handoffs
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The inbox gives every rep shared context so hot leads stop slipping between people.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel flex items-center rounded-[32px] p-8 sm:p-10">
          <div className="w-full">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/18 bg-emerald-400/12 lg:mx-0">
                <MessageSquare className="h-6 w-6 text-emerald-300" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold text-white">
                Sign in and get back to the conversations that matter.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Faster responses, tighter follow-ups, and clear ownership start here.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                    Work email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-slate-200">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs text-emerald-300 hover:text-white">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    placeholder="Enter your secure password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#41d39b,#6db3ff)] px-5 py-3.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    Enter the Workspace
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center text-sm text-slate-300">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-emerald-300 hover:text-white">
                  Create one now
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
