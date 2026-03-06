'use client';

import Link from "next/link";
import { ArrowRight, MessageSquare, Users, BarChart3, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to inbox if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/inbox');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render landing page if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-500" />
            <span className="font-semibold text-white">WhatsApp CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-white">
            WhatsApp CRM Wrapper
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Turn WhatsApp into a proper Sales + Support CRM. Manage leads, automate follow-ups, and never lose a conversation.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium flex items-center gap-2 hover:bg-emerald-500 transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-zinc-900 text-white font-medium border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-4 gap-6 mt-20">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <MessageSquare className="w-8 h-8 text-emerald-500 mb-4" />
            <h3 className="font-semibold text-white mb-2">Team Inbox</h3>
            <p className="text-sm text-zinc-500">
              Shared WhatsApp number for your entire team
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <Users className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="font-semibold text-white mb-2">Lead Management</h3>
            <p className="text-sm text-zinc-500">
              Pipeline stages from New to Won
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <BarChart3 className="w-8 h-8 text-purple-500 mb-4" />
            <h3 className="font-semibold text-white mb-2">Follow-ups</h3>
            <p className="text-sm text-zinc-500">
              Never miss a lead with reminders
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <Shield className="w-8 h-8 text-yellow-500 mb-4" />
            <h3 className="font-semibold text-white mb-2">Templates</h3>
            <p className="text-sm text-zinc-500">
              Quick replies with variables
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-20">
          <h2 className="text-2xl font-semibold text-white text-center mb-10">
            Simple Pricing (India-friendly)
          </h2>
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <div className="text-sm text-zinc-500 mb-2">Starter</div>
              <div className="text-3xl font-bold text-white mb-4">₹999/mo</div>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>1 WhatsApp number</li>
                <li>1 user</li>
                <li>Basic CRM</li>
                <li>Templates</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl border-2 border-emerald-500 bg-zinc-900/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                Popular
              </div>
              <div className="text-sm text-zinc-500 mb-2">Pro</div>
              <div className="text-3xl font-bold text-white mb-4">₹2999/mo</div>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>3 users</li>
                <li>Follow-ups</li>
                <li>Tags & Reports</li>
                <li>Priority support</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <div className="text-sm text-zinc-500 mb-2">Business</div>
              <div className="text-3xl font-bold text-white mb-4">₹6999/mo</div>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>10 users</li>
                <li>Broadcasts</li>
                <li>Automation</li>
                <li>Analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
