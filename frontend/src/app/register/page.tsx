'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageSquare, Rocket, Sparkles, Star, ChevronRight, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [success, setSuccess] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [autoVerified, setAutoVerified] = useState(false);
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
      const result = await register(
        formData.email,
        formData.password,
        formData.name,
        formData.workspaceName || undefined
      );
      setSuccess(result.message);
      setAutoVerified(result.autoVerified || false);
      setVerificationUrl(result.verificationUrl || '');
      if (result.autoVerified) {
        setTimeout(() => router.push('/login?registered=1'), 1200);
      }
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
    <div className="min-h-screen px-4 py-10 bg-[#030712]">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left Panel - Brand Side */}
        <div className="glass-panel-strong hidden rounded-[32px] p-10 lg:flex lg:flex-col lg:justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-400/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/12 bg-purple-400/8 px-4 py-2 text-sm text-purple-200/80">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Build the revenue engine your team deserves
            </div>
            <h1 className="mt-8 max-w-md text-5xl font-bold leading-tight text-white">
              Launch a workspace. <span className="gradient-text">Win more deals.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-400">
              Create your account, invite your team, and turn every WhatsApp conversation 
              into a structured pipeline with clear ownership and zero chaos.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span>Go live in under 3 minutes — no technical skills needed</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Rocket className="h-4 w-4 text-sky-400" />
                <span>14-day free trial on Growth plan — no credit card required</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span>Enterprise-grade security with role-based access control</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-emerald-400/8 border border-emerald-400/10 px-5 py-3">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <p className="text-sm text-zinc-300">
              <span className="font-semibold text-emerald-300">4.9/5</span> from 500+ businesses that doubled their close rates
            </p>
          </div>
        </div>

        {/* Right Panel - Register Form */}
        <div className="glass-panel-strong flex items-center rounded-[32px] p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-full relative z-10">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/18 bg-emerald-400/12 lg:mx-0 pulse-glow">
                <Rocket className="h-6 w-6 text-emerald-300" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-white leading-tight">
                Start closing faster. <span className="gradient-text">Free.</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Create your workspace and turn message volume into structured pipeline, accountability, and closed deals.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3.5 text-sm text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-200">
                  <p className="font-medium">{success}</p>
                  {verificationUrl && (
                    <p className="mt-2 break-all">
                      Verify link:{' '}
                      <a href={verificationUrl} className="underline hover:text-emerald-300">{verificationUrl}</a>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-200">
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
                    className="input-premium w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    className="input-premium w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="workspaceName" className="mb-2 block text-sm font-medium text-zinc-200">
                    Workspace name
                  </label>
                  <input
                    id="workspaceName"
                    name="workspaceName"
                    type="text"
                    value={formData.workspaceName}
                    onChange={handleChange}
                    className="input-premium w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none"
                    placeholder="Acme Growth Team"
                  />
                  <p className="mt-1.5 text-xs text-zinc-600">Leave blank and we&apos;ll create one for you.</p>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-200">
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
                    className="input-premium w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none"
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
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-zinc-200">
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
                    className="input-premium w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none"
                    placeholder="Repeat your password"
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
                    <span>Creating your workspace...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10">Launch My Workspace</span>
                    <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-zinc-600">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">Privacy Policy</a>.
              </p>

              <div className="text-center text-sm text-zinc-400">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                  Sign in →
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
