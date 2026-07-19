'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  Clock3,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users2,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import HeroScene from "@/components/three/HeroScene";
import { useScrollReveal } from "@/hooks/useScrollReveal";

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? "visible" : ""} ${delay ? `reveal-delay-${delay}` : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function RevealCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? "visible" : ""} ${delay ? `reveal-delay-${delay}` : ""}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/inbox");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const proofPoints = [
    "Close faster with shared ownership and instant handoffs",
    "Stop lead leakage with reminders, templates, and pipeline visibility",
    "Give every rep the same playbook without slowing them down",
  ];

  const stats = [
    { label: "First replies", value: "< 2 min", note: "for teams using shared inbox routing" },
    { label: "Follow-up consistency", value: "3x", note: "when reminders and templates stay in one workflow" },
    { label: "Team visibility", value: "100%", note: "across chats, stages, owners, and activity" },
  ];

  const features = [
    {
      icon: MessageSquare,
      title: "Shared inbox built for closing",
      body: "One WhatsApp number, one live team view, zero chaos. Everyone sees ownership, status, and next action instantly.",
    },
    {
      icon: Users2,
      title: "Pipeline that shows momentum",
      body: "Move leads from first message to won deal with a visual stage flow your team will actually use every day.",
    },
    {
      icon: Clock3,
      title: "Follow-ups that rescue revenue",
      body: "Scheduled nudges, reminders, and saved replies keep warm leads from silently going cold.",
    },
    {
      icon: ShieldCheck,
      title: "Role-based workspace control",
      body: "Admins and agents work in the same system without exposing the wrong data or breaking accountability.",
    },
  ];

  const customerFits = [
    {
      icon: Building2,
      title: "Built for high-intent service businesses",
      body: "Ideal for real estate, education, clinics, agencies, and local businesses that already close business through WhatsApp.",
    },
    {
      icon: Target,
      title: "Best when leads are slipping through the cracks",
      body: "If messages get missed, follow-ups are inconsistent, or no one knows who owns a lead, this becomes an easy ROI conversation.",
    },
    {
      icon: Trophy,
      title: "Easy to pitch as revenue protection",
      body: "You are selling faster first replies, better handoffs, higher close rates, and fewer lost conversations.",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      note: "forever",
      description: "For individuals getting started with WhatsApp CRM.",
      points: [
        "1 user",
        "100 contacts",
        "500 messages/mo",
        "Basic inbox",
        "1 chatbot flow",
      ],
      cta: "Start Free",
      featured: false,
    },
    {
      name: "Growth",
      price: "$29",
      note: "per month",
      description: "For small teams ready to scale their WhatsApp sales workflow.",
      points: [
        "5 users",
        "2,000 contacts",
        "Unlimited messages",
        "Full inbox with team management",
        "Chatbot flows & AI auto-reply",
        "Team management",
      ],
      cta: "Start 14-Day Trial",
      featured: true,
    },
    {
      name: "Business",
      price: "$79",
      note: "per month",
      description: "For businesses that need unlimited access and custom integrations.",
      points: [
        "Unlimited users",
        "Unlimited contacts",
        "Unlimited messages",
        "Priority support",
        "Custom integrations",
        "API access",
      ],
      cta: "Talk to Sales",
      featured: false,
    },
  ];

  const objectionHandlers = [
    "We already use WhatsApp every day, but we still lose leads.",
    "Our team replies, but follow-up is inconsistent and hard to track.",
    "We need one place to see who owns each conversation and what happens next.",
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <HeroScene scrollY={scrollY} />
      <div className="hero-grid pointer-events-none fixed inset-0 opacity-30" />

      <nav className="sticky top-0 z-20 border-b border-white/8 bg-[rgba(4,10,20,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="glow-ring flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/12">
              <MessageSquare className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <span className="font-semibold text-white">WhatsApp CRM</span>
              <p className="text-xs text-sky-100/60">Built to turn chats into pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="hidden text-slate-300 hover:text-white md:block">
              Pricing
            </a>
            <Link href="/login" className="text-slate-300 hover:text-white">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-5 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/22"
            >
              Launch Your Workspace
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pb-14 pt-20 lg:pt-28">
          <RevealSection>
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/12 bg-white/6 px-4 py-2 text-sm text-sky-100/80">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Sales teams stop losing hot leads when WhatsApp gets organized
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Stop losing WhatsApp leads and turn every conversation into a tracked sales opportunity.
                </h1>
                <p className="max-w-2xl text-balance text-lg leading-8 text-slate-300">
                  Give your team one shared inbox, clear ownership, fast follow-ups, and a pipeline that actually shows what
                  is moving, what is stalled, and what is closing. This is the CRM clients buy when missed chats start costing real money.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#41d39b,#6db3ff)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(65,211,155,0.28)]"
                >
                  Start Closing Faster
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/9"
                >
                  View Pricing
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {proofPoints.map((point) => (
                  <div key={point} className="glass-panel rounded-2xl px-4 py-4 text-sm text-slate-200">
                    <div className="mb-2 flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Outcome-driven
                    </div>
                    <p className="leading-6 text-slate-300">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel spotlight-card rounded-[32px] p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-sky-100/45">Revenue Control Center</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    See who owns the conversation, what moves next, and where money is stuck.
                  </h2>
                </div>
                <div className="rounded-2xl border border-emerald-300/18 bg-emerald-300/10 p-3 text-emerald-200">
                  <Zap className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-white/8 bg-[rgba(255,255,255,0.03)] p-5">
                    <div className="flex items-end justify-between gap-6">
                      <div>
                        <p className="text-sm text-slate-400">{stat.label}</p>
                        <p className="mt-2 text-4xl font-semibold text-white">{stat.value}</p>
                      </div>
                      <BarChart3 className="h-9 w-9 text-sky-300" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{stat.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10">
          <RevealSection>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="glass-panel rounded-[30px] p-7">
              <p className="text-sm uppercase tracking-[0.24em] text-amber-200/65">Client-Facing Pitch</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Your sales team should not be closing deals from a chaotic chat list.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                WhatsApp is where leads show intent, ask questions, and make buying decisions. When those conversations stay
                unmanaged, businesses lose speed, consistency, and revenue. This platform gives them one operating system for
                replies, ownership, follow-up, and conversion.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {objectionHandlers.map((line) => (
                <div key={line} className="glass-panel rounded-[28px] p-6">
                  <div className="mb-4 inline-flex rounded-2xl border border-emerald-300/18 bg-emerald-300/10 p-3 text-emerald-200">
                    <BadgeDollarSign className="h-5 w-5" />
                  </div>
                  <p className="text-base leading-7 text-slate-200">{line}</p>
                </div>
              ))}
            </div>
          </div>
          </RevealSection>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-10">
          <RevealSection>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, i) => (
              <RevealCard key={feature.title} delay={i + 1}>
                <div className="glass-panel rounded-[28px] p-6">
                  <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-white/6 p-3 text-sky-200">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{feature.body}</p>
                </div>
              </RevealCard>
            ))}
          </div>
          </RevealSection>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10">
          <RevealSection>
          <div className="grid gap-5 lg:grid-cols-3">
            {customerFits.map((fit, i) => (
              <RevealCard key={fit.title} delay={i + 1}>
                <div className="glass-panel rounded-[28px] p-6">
                  <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-white/6 p-3 text-amber-200">
                    <fit.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{fit.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{fit.body}</p>
                </div>
              </RevealCard>
            ))}
          </div>
          </RevealSection>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
          <RevealSection>
          <div className="mb-10 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-sky-100/45">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Start free, scale as you grow.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Try WhatsApp CRM free with no commitment. Upgrade when you&apos;re ready to unlock more users, contacts, and powerful automation features.
            </p>
          </div>
          </RevealSection>

          <div className="grid gap-5 xl:grid-cols-3">
            {pricingPlans.map((plan, i) => (
              <RevealCard key={plan.name} delay={i + 1}>
              <div
                key={plan.name}
                className={`glass-panel rounded-[32px] p-7 ${plan.featured ? "border-emerald-300/30 bg-emerald-400/10" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{plan.description}</p>
                  </div>
                  {plan.featured ? (
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                      Most Popular
                    </span>
                  ) : null}
                </div>

                <div className="mt-8">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-semibold text-white">{plan.price}</span>
                    <span className="pb-2 text-sm text-slate-400">{plan.note}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {plan.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm leading-7 text-slate-200">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold ${
                    plan.featured
                      ? "bg-[linear-gradient(135deg,#41d39b,#6db3ff)] text-slate-950 shadow-[0_18px_45px_rgba(65,211,155,0.28)]"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/9"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
              </RevealCard>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <RevealSection>
          <div className="glass-panel rounded-[36px] p-8 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-amber-200/65">Pricing Framed Around ROI</p>
                <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                  Sell it as a system that protects revenue, speeds up response time, and keeps the team accountable.
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                  The strongest buyers are businesses already getting leads on WhatsApp but struggling with missed replies,
                  poor handoffs, weak follow-up discipline, and zero pipeline visibility. That is who this offer is built for.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
              >
                Turn Interest Into Trials
              </Link>
            </div>
          </div>
          </RevealSection>
        </section>
        <footer className="border-t border-white/8 bg-[rgba(4,10,20,0.6)]">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="glow-ring flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/12">
                    <MessageSquare className="h-4 w-4 text-emerald-300" />
                  </div>
                  <span className="font-semibold text-white">WhatsApp CRM</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  The shared inbox and pipeline that turns WhatsApp conversations into revenue.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">Product</h4>
                <ul className="mt-3 space-y-2">
                  <li><a href="#features" className="text-sm text-slate-400 hover:text-white">Features</a></li>
                  <li><a href="#pricing" className="text-sm text-slate-400 hover:text-white">Pricing</a></li>
                  <li><Link href="/register" className="text-sm text-slate-400 hover:text-white">API</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">Company</h4>
                <ul className="mt-3 space-y-2">
                  <li><a href="#" className="text-sm text-slate-400 hover:text-white">About</a></li>
                  <li><a href="#" className="text-sm text-slate-400 hover:text-white">Blog</a></li>
                  <li><a href="#" className="text-sm text-slate-400 hover:text-white">Contact</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">Legal</h4>
                <ul className="mt-3 space-y-2">
                  <li><a href="/privacy" className="text-sm text-slate-400 hover:text-white">Privacy</a></li>
                  <li><a href="/terms" className="text-sm text-slate-400 hover:text-white">Terms</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-10 border-t border-white/8 pt-6 text-center text-sm text-slate-500">
              &copy; 2026 WhatsApp CRM. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
