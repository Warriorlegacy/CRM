'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, X, ShieldAlert, Sparkles, Mail } from 'lucide-react';
import { api } from '@/lib/api';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token. Please verify the URL from your inbox.');
      return;
    }

    const performVerification = async () => {
      try {
        await api.get(`/verify/${token}`);
        setStatus('success');
        setMessage('Your email has been verified successfully! Redirecting to sign in...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.data?.message || err?.message || 'Verification failed. The token may be expired or invalid.');
      }
    };

    performVerification();
  }, [token, router]);

  return (
    <div className="glass-panel rounded-[32px] p-8 sm:p-10 space-y-6 text-center">
      {status === 'loading' && (
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/18 bg-emerald-400/12">
            <Mail className="h-6 w-6 text-emerald-300 animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Verifying account</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
          <div className="mx-auto h-1 w-24 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-[linear-gradient(90deg,#41d39b,#6db3ff)] rounded-full animate-[shimmer_1.5s_infinite_linear]" />
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <Check className="h-6 w-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Email Verified!</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
          <div className="pt-2">
            <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#41d39b,#6db3ff)] px-6 py-3 text-sm font-semibold text-slate-950">
              Sign In Now
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <X className="h-6 w-6 text-red-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Verification Failed</h2>
          <p className="text-red-300 text-sm leading-relaxed">{message}</p>
          <div className="pt-2">
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-semibold text-white">
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <Suspense fallback={
          <div className="flex items-center justify-center p-10 text-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mr-2" />
            Loading verification...
          </div>
        }>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
