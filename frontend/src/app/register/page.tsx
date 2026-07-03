'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageSquare, Rocket, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    workspaceName: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      const message = await register(
        formData.email,
        formData.password,
        formData.name,
        formData.workspaceName || undefined
      );
      setSuccess(message);
      setTimeout(() => router.push('/login?registered=1'), 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    }
  };

  const getPasswordStrength = (pw: string) => {
    if (pw.length === 0) return { level: 0, label: '', color: '' };
    if (pw.length < 8) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (pw.length <= 12) return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
    return { level: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="glass-panel hidden rounded-[32px] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-sky-100/80">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Build the WhatsApp engine your team can scale on
            </div>
            <h1 className="mt-8 max-w-md text-5xl font-semibold leading-tight text-white">
              Launch a workspace that makes every incoming chat easier to win.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
              Create your account, invite your team, and turn message volume into structured pipeline, accountability, and action.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-emerald-300">
                <Rocket className="h-5 w-5" />
                Production-minded setup
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                JWT auth, role-aware workspaces, and a cleaner deployment path make onboarding look professional from day one.
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-sky-300">
                <MessageSquare className="h-5 w-5" />
                Conversations with structure
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The app turns WhatsApp from a chat stream into an organized revenue workflow your client can trust.
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
                Create a workspace your client will feel confident paying for.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Set up the team hub for faster replies, cleaner handoffs, and a more visible sales pipeline.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    placeholder="John Doe"
                  />
                </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="workspaceName" className="mb-2 block text-sm font-medium text-slate-200">
                    Workspace name
                  </label>
                  <input
                    id="workspaceName"
                    name="workspaceName"
                    type="text"
                    value={formData.workspaceName}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    placeholder="Acme Growth Team"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">Leave blank and we&apos;ll create one for you.</p>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    placeholder="At least 8 characters"
                  />
                  {formData.password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength.level >= 1 ? passwordStrength.color : 'bg-white/10'}`} />
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength.level >= 2 ? passwordStrength.color : 'bg-white/10'}`} />
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength.level >= 3 ? passwordStrength.color : 'bg-white/10'}`} />
                      </div>
                      <p className={`mt-1 text-xs ${passwordStrength.level === 1 ? 'text-red-400' : passwordStrength.level === 2 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-200">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    placeholder="Repeat your password"
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
                    Creating your workspace...
                  </>
                ) : (
                  <>
                    Create My Workspace
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-emerald-300 hover:text-white">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-emerald-300 hover:text-white">Privacy Policy</a>.
              </p>

              <div className="text-center text-sm text-slate-300">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-emerald-300 hover:text-white">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
