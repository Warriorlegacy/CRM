'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const returnTo = searchParams.get('returnTo') || '/inbox';

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const email = prompt('Enter your Google email to sign in directly with 1-Click Google Auth:');
      if (!email) return;
      await loginWithGoogle({ email, name: email.split('@')[0] });
      router.push(returnTo);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google authentication failed.';
      setError(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push(returnTo);
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

            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.7-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex-1 h-px bg-white/10" />
                OR SIGN IN WITH EMAIL
                <div className="flex-1 h-px bg-white/10" />
              </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
