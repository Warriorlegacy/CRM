'use client';

import { useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, MessageSquare, ShieldCheck, Sparkles, Star, ChevronRight } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const returnTo = searchParams.get('returnTo') || '/inbox';

  useGoogleOneTapLogin({
    onSuccess: async (res) => {
      if (res.credential) {
        try {
          await loginWithGoogle(res.credential);
          router.push(returnTo);
        } catch {}
      }
    },
    onError: () => {},
    disabled: !GOOGLE_CLIENT_ID,
    cancel_on_tap_outside: false,
  });

  const handleGoogleSuccess = useCallback(async (credentialResponse: { credential?: string }) => {
    setError('');
    if (!credentialResponse.credential) {
      setError('Google authentication failed. No credential received.');
      return;
    }
    try {
      await loginWithGoogle(credentialResponse.credential);
      router.push(returnTo);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google authentication failed.';
      setError(message);
    }
  }, [loginWithGoogle, router, returnTo]);

  const handleGoogleError = useCallback(() => {
    setError('Google Sign-In was not completed. Please try again.');
  }, []);

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
    <div className="min-h-screen px-4 py-10 bg-[#030712]">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left Panel - Brand Side */}
        <div className="glass-panel-strong hidden rounded-[32px] p-10 lg:flex lg:flex-col lg:justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/12 bg-emerald-400/8 px-4 py-2 text-sm text-emerald-200/80">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Welcome back to the revenue engine
            </div>
            <h1 className="mt-8 max-w-md text-5xl font-bold leading-tight text-white">
              Every conversation. <span className="gradient-text">Every close.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-400">
              Track owners, follow-ups, unread conversations, and next actions — without chasing 
              updates across chats and spreadsheets. Your team deserves better.
            </p>

            <div className="mt-10 flex items-center gap-2 rounded-2xl bg-emerald-400/8 border border-emerald-400/10 px-5 py-3">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <p className="text-sm text-zinc-300">
                <span className="font-semibold text-emerald-300">4.9/5</span> from 500+ business teams
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-300 hover:border-emerald-400/10">
              <div className="flex items-center gap-3 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
                Enterprise-grade security
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                JWT-based auth and role-aware workspaces keep every conversation protected.
              </p>
            </div>
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-300 hover:border-sky-400/10">
              <div className="flex items-center gap-3 text-sky-300">
                <MessageSquare className="h-5 w-5" />
                Zero-chaos team inbox
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Live ownership tags and collision detection so hot leads never slip through.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="glass-panel-strong flex items-center rounded-[32px] p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-full relative z-10">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/18 bg-emerald-400/12 lg:mx-0 pulse-glow">
                <MessageSquare className="h-6 w-6 text-emerald-300" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-white leading-tight">
                Get back to the conversations that matter.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Faster responses, tighter follow-ups, clear ownership — it all starts here.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {GOOGLE_CLIENT_ID ? (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="pill"
                    width={400}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setError('Google 1-Tap Login requires NEXT_PUBLIC_GOOGLE_CLIENT_ID from Google Cloud Console.')}
                  className="w-full py-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-full flex items-center justify-center gap-2 text-sm transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Sign in with Google
                </button>
              )}

              <div className="flex items-center gap-3 text-xs text-zinc-600">
                <div className="flex-1 h-px bg-white/[0.06]" />
                OR SIGN IN WITH EMAIL
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3.5 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-200">
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
                    className="input-premium w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-zinc-200">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
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
                    className="input-premium w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none"
                    placeholder="Enter your secure password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white btn-gradient overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner-premium" />
                    <span>Signing you in...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10">Enter the Workspace</span>
                    <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="text-center text-sm text-zinc-400">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                  Create one now →
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#030712]">
          <div className="spinner-premium" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </GoogleOAuthProvider>
  );
}
