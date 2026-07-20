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
  Star,
  TrendingUp,
  Globe,
  Rocket,
  ChevronRight,
  Infinity,
  Gauge,
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

function RevealBlur({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`reveal-blur ${isVisible ? "visible" : ""} ${delay ? `reveal-delay-${delay}` : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function CountUp({ end, suffix = "", prefix = "", duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref: revealRef, isVisible } = useScrollReveal();

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return (
    <span ref={revealRef} className="count-up">
      {prefix}{count}{suffix}
    </span>
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/inbox");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <div className="flex flex-col items-center space-y-6">
          <div className="spinner-premium" />
          <p className="text-zinc-500 text-sm tracking-wide">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  const socialProof = [
    { text: "Leading businesses trust Signhify to close more deals", icon: Trophy },
    { text: "Average response time drops from hours to minutes", icon: Gauge },
    { text: "Teams report 3x higher follow-up consistency", icon: TrendingUp },
  ];

  // Parallax scroll offset
  const heroParallax = scrollY * 0.3;
  const heroOpacity = Math.max(1 - scrollY / 600, 0.3);

  const stats = [
    { label: "First Response Time", value: "< 2 min", note: "with shared inbox routing, reps never guess who's next" },
    { label: "Follow-up Consistency", value: "3.2x", note: "higher when reminders and templates stay in one workflow" },
    { label: "Team Visibility", value: "100%", note: "across chats, stages, owners, and real-time activity" },
    { label: "Leaves No Lead Behind", value: "0", note: "missed conversations with automated escalation" },
  ];

  const features = [
    {
      icon: MessageSquare,
      title: "Unified Multi-Agent Inbox",
      body: "One WhatsApp number, zero chaos. Every message lands in a shared inbox with live ownership tags, collision warnings, and instant context. Your team moves as one unit.",
      gradient: "from-emerald-400 to-emerald-600",
      glow: "rgba(65,211,155,0.15)",
    },
    {
      icon: Users2,
      title: "Visual Sales Pipeline",
      body: "Drag leads from New ➝ Follow-up ➝ Negotiation ➝ Won. See exactly what's moving, what's stalled, and who needs help. Pipeline becomes your team's single source of truth.",
      gradient: "from-sky-400 to-blue-600",
      glow: "rgba(109,179,255,0.15)",
    },
    {
      icon: Clock3,
      title: "AI-Powered Follow-ups",
      body: "Never lose a warm lead again. Set smart reminders, auto-schedule follow-ups, and let AI draft replies that keep conversations moving toward closed deals.",
      gradient: "from-purple-400 to-violet-600",
      glow: "rgba(167,139,250,0.15)",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise-Grade Control",
      body: "Role-based access, conversation locking, internal notes, and full audit trails. Admins sleep well knowing data stays secure and accountable.",
      gradient: "from-amber-400 to-orange-600",
      glow: "rgba(245,158,11,0.15)",
    },
    {
      icon: Zap,
      title: "AI Auto-Responders",
      body: "Your choice of GPT-4o, Claude, Gemini, Groq, or 18+ AI models. Automate FAQs, qualify leads at 3 AM, and reply with your brand voice.",
      gradient: "from-rose-400 to-pink-600",
      glow: "rgba(244,63,94,0.15)",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      body: "See response times, conversion rates, team performance, and pipeline velocity on live dashboards. What gets measured gets closed.",
      gradient: "from-cyan-400 to-teal-600",
      glow: "rgba(6,182,212,0.15)",
    },
  ];

  const trustBar = [
    { name: "Fastest Setup", desc: "Go live in 3 minutes" },
    { name: "No Code Required", desc: "Built for humans" },
    { name: "Bank-Grade Security", desc: "256-bit encrypted" },
    { name: "24/7 Support", desc: "We've got your back" },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$0",
      note: "forever free",
      tagline: "Perfect for solo operators testing the waters",
      points: [
        "1 user seat",
        "100 contacts",
        "500 messages/month",
        "Basic shared inbox",
        "1 chatbot flow",
        "Email support",
      ],
      cta: "Start Free →",
      featured: false,
    },
    {
      name: "Growth",
      price: "$29",
      note: "per month",
      tagline: "For small teams ready to scale like champs",
      points: [
        "5 user seats",
        "2,000 contacts",
        "Unlimited messages",
        "Full inbox + team management",
        "AI auto-reply & chatbot flows",
        "Pipeline & analytics",
        "Priority email support",
      ],
      cta: "Start 14-Day Trial →",
      featured: true,
    },
    {
      name: "Business",
      price: "$79",
      note: "per month",
      tagline: "For growing businesses that need it all",
      points: [
        "Unlimited users",
        "Unlimited contacts",
        "Unlimited messages",
        "Custom AI model integration",
        "API access & webhooks",
        "Dedicated success manager",
        "99.9% uptime SLA",
      ],
      cta: "Talk to Sales →",
      featured: false,
    },
  ];

  const testimonials = [
    {
      quote: "We went from losing 40% of WhatsApp leads to closing 73% — in two weeks. This isn't a CRM, it's a revenue engine.",
      author: "Priya Sharma",
      role: "Sales Director, Luxe Properties",
    },
    {
      quote: "My team of 12 finally has one source of truth. No more 'who replied to this chat?' chaos. Signhify changed our workflow overnight.",
      author: "Rahul Verma",
      role: "CEO, EduConnect India",
    },
    {
      quote: "The AI auto-responder qualifies leads while we sleep. We wake up to hot leads ready to close. Game changer.",
      author: "Ananya Patel",
      role: "Founder, HealthFirst Clinics",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#030712]">
      {/* Parallax Cursor Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(65,211,155,0.08), transparent)`,
        }}
      />
      <HeroScene scrollY={scrollY} />
      <div className="hero-grid pointer-events-none fixed inset-0 opacity-20" />

      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-20 border-b border-white/[0.06] bg-[rgba(3,7,18,0.80)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="glow-ring flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/12 transition-all duration-300 group-hover:scale-110">
              <MessageSquare className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">Signhify</span>
              <p className="text-[10px] text-zinc-500 tracking-widest uppercase">CRM & Automation</p>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden text-sm text-zinc-400 hover:text-white transition-colors md:block">Features</a>
            <a href="#pricing" className="hidden text-sm text-zinc-400 hover:text-white transition-colors md:block">Pricing</a>
            <a href="/guide" className="hidden text-sm text-zinc-400 hover:text-white transition-colors md:block">Guide</a>
            <Link href="/login" className="text-sm text-zinc-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white btn-gradient"
            >
              <span className="relative z-10">Launch Your Workspace</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* ─── HERO ─── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 lg:pt-24">
          <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <RevealBlur>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/12 bg-emerald-400/8 px-4 py-2 text-sm text-emerald-200/80">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span className="hidden sm:inline">The CRM that turns WhatsApp chaos into </span>
                  <span className="gradient-text font-semibold">closed deals</span>
                </div>
              </RevealBlur>

              <RevealBlur delay={1}>
                <h1 className="max-w-3xl text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
                  Stop Losing Leads to{" "}
                  <span className="gradient-text">Unseen Messages</span>
                </h1>
              </RevealBlur>

              <RevealBlur delay={2}>
                <p className="max-w-2xl text-balance text-lg leading-relaxed text-zinc-400">
                  WhatsApp is where your customers buy. But without a system, hot leads go cold, 
                  follow-ups fall through cracks, and revenue leaks through every thread. 
                  <span className="text-white font-medium"> Signhify gives your team one shared inbox, clear ownership, and a pipeline that actually closes.</span>
                </p>
              </RevealBlur>

              <RevealBlur delay={3}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-bold text-white btn-gradient overflow-hidden"
                  >
                    <span className="relative z-10">Start Closing Faster</span>
                    <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                  <Link
                    href="#features"
                    className="btn-glass inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-medium text-zinc-200"
                  >
                    See How It Works
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </RevealBlur>

              {/* Social Proof */}
              <RevealBlur delay={4}>
                <div className="flex flex-wrap gap-3 pt-2">
                  {socialProof.map((item, i) => (
                    <div key={i} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5">
                      <item.icon className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-zinc-400">{item.text}</span>
                    </div>
                  ))}
                </div>
              </RevealBlur>
            </div>

            {/* ─── Stat Panel ─── */}
            <RevealBlur delay={3}>
              <div className="spotlight-card glass-panel-strong rounded-[32px] p-6 sm:p-8 border-gradient">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Revenue Control Center</p>
                    <h2 className="mt-3 text-2xl font-bold text-white leading-tight">
                      Every conversation. <br />
                      <span className="gradient-text">Every owner. Every close.</span>
                    </h2>
                  </div>
                  <div className="rounded-2xl border border-emerald-300/18 bg-emerald-400/10 p-3">
                    <Zap className="h-7 w-7 text-emerald-300" />
                  </div>
                </div>

                <div className="space-y-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-emerald-400/10 hover:bg-emerald-400/5"
                    >
                      <div className="flex items-end justify-between gap-6">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-zinc-500">{stat.label}</p>
                          <p className="mt-2 text-4xl font-bold text-white">{stat.value}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-zinc-600 group-hover:text-emerald-400 transition-colors duration-300" />
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-500">{stat.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-400/8 border border-emerald-400/10 px-5 py-3">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <p className="text-sm text-zinc-300">
                    <span className="font-semibold text-emerald-300">4.9/5</span> from 500+ business teams
                  </p>
                </div>
              </div>
            </RevealBlur>
          </div>
        </section>

        {/* ─── TRUST BAR ─── */}
        <section className="mx-auto max-w-7xl px-6 py-8">
          <RevealSection>
            <div className="divider-gradient mb-8" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {trustBar.map((item) => (
                <div key={item.name} className="text-center">
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="divider-gradient mt-8" />
          </RevealSection>
        </section>

        {/* ─── PROBLEM / PAIN POINT ─── */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <RevealBlur>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 mb-4">The Problem</p>
              <h2 className="text-4xl font-bold text-white sm:text-5xl">
                Your WhatsApp Is Leaking{" "}
                <span className="gradient-text">Money Right Now</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
                Every unseen message, every forgotten follow-up, every handoff that falls through — 
                that's revenue walking out the door. Sales teams using WhatsApp without a CRM 
                lose an average of <span className="text-white font-semibold">34% of their leads</span> to the chaos.
              </p>
            </div>
          </RevealBlur>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { icon: BadgeDollarSign, text: "We already use WhatsApp every day — but we still lose leads.", color: "text-rose-400" },
              { icon: Users2, text: "Our team replies fast, but follow-up is inconsistent and nobody owns the next step.", color: "text-amber-400" },
              { icon: Globe, text: "We need one place to see every conversation, who owns it, and what happens next.", color: "text-sky-400" },
            ].map((obj, i) => (
              <RevealCard key={i} delay={i + 1}>
                <div className="glass-panel rounded-[28px] p-7 card-hover-premium">
                  <div className={`mb-5 inline-flex rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3 ${obj.color}`}>
                    <obj.icon className="h-6 w-6" />
                  </div>
                  <p className="text-lg leading-relaxed text-zinc-200 font-medium">{obj.text}</p>
                </div>
              </RevealCard>
            ))}
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="features" className="relative mx-auto max-w-7xl px-6 py-20">
          <RevealBlur>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 mb-4">Everything You Need</p>
              <h2 className="text-4xl font-bold text-white sm:text-5xl">
                One Platform.{" "}
                <span className="gradient-text">Infinite Possibilities.</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-400">
                From first message to closed deal — Signhify gives your team the tools to move faster, 
                collaborate better, and close more.
              </p>
            </div>
          </RevealBlur>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <RevealCard key={feature.title} delay={i + 1}>
                <div className="glass-panel rounded-[28px] p-7 card-hover-premium h-full flex flex-col">
                  <div
                    className="mb-5 inline-flex rounded-2xl border border-white/[0.06] p-3"
                    style={{ background: `linear-gradient(135deg, ${feature.glow}, transparent)`, borderColor: feature.glow }}
                  >
                    <feature.icon className={`h-6 w-6 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400 flex-1">{feature.body}</p>
                  <div className="mt-6 flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <span>Learn more</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </RevealCard>
            ))}
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <RevealBlur>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 mb-4">Real Results</p>
              <h2 className="text-4xl font-bold text-white sm:text-5xl">
                Trusted by Teams That{" "}
                <span className="gradient-text">Close Every Day</span>
              </h2>
            </div>
          </RevealBlur>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <RevealCard key={i} delay={i + 1}>
                <div className="glass-panel rounded-[28px] p-7 card-hover-premium">
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-base leading-relaxed text-zinc-300 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 pt-6 border-t border-white/[0.06]">
                    <p className="text-sm font-semibold text-white">{t.author}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </RevealCard>
            ))}
          </div>
        </section>

        {/* ─── STATS COUNTER ─── */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <RevealSection>
            <div className="glass-panel-strong rounded-[36px] p-10 sm:p-14 border-gradient">
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Users2, prefix: "", end: 5000, suffix: "+", label: "Active Teams" },
                  { icon: MessageSquare, prefix: "", end: 250000, suffix: "+", label: "Conversations Managed" },
                  { icon: TrendingUp, prefix: "", end: 73, suffix: "%", label: "Avg. Close Rate" },
                  { icon: Rocket, prefix: "< ", end: 3, suffix: " min", label: "Setup Time" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 mb-4">
                      <stat.icon className="h-6 w-6 text-emerald-300" />
                    </div>
                    <p className="text-4xl font-bold text-white">
                      <CountUp end={stat.end} prefix={stat.prefix} suffix={stat.suffix} />
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
          <RevealBlur>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 mb-4">Simple Pricing</p>
              <h2 className="text-4xl font-bold text-white sm:text-5xl">
                Start Free.{" "}
                <span className="gradient-text">Scale When You Win.</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-400">
                No hidden fees. No surprise charges. Cancel anytime.
              </p>
            </div>
          </RevealBlur>

          <div className="grid gap-6 xl:grid-cols-3 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <RevealCard key={plan.name} delay={i + 1}>
                <div
                  className={`glass-panel rounded-[32px] p-8 card-hover-premium flex flex-col h-full ${
                    plan.featured
                      ? "border-gradient bg-emerald-400/5"
                      : ""
                  }`}
                >
                  {plan.featured && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-400/20 to-emerald-400/10 border border-emerald-400/20 px-3.5 py-1.5 mb-6">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{plan.tagline}</p>

                  <div className="mt-6">
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-bold text-white">{plan.price}</span>
                      <span className="pb-2 text-sm text-zinc-500">{plan.note}</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3 flex-1">
                    {plan.points.map((point) => (
                      <div key={point} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/register"
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-bold transition-all duration-300 ${
                      plan.featured
                        ? "btn-gradient text-white shadow-[0_18px_45px_rgba(65,211,155,0.25)]"
                        : "btn-glass text-zinc-200 hover:text-white"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </RevealCard>
            ))}
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <RevealBlur>
            <div className="glass-panel-strong rounded-[40px] p-10 sm:p-16 text-center relative overflow-hidden border-gradient">
              {/* Decorative gradients */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/8 px-4 py-2 text-sm text-emerald-200/80 mb-6">
                  <Rocket className="h-4 w-4" />
                  Start Closing More Deals Today
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                  Your First Deal Is{" "}
                  <span className="gradient-text">One Click Away</span>
                </h2>
                <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of businesses turning WhatsApp conversations into repeatable revenue. 
                  No credit card required. No technical skills needed. Just a better way to sell.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center justify-center gap-3 rounded-full px-10 py-4 text-base font-bold text-white btn-gradient overflow-hidden"
                  >
                    <span className="relative z-10">Launch Your Workspace Free</span>
                    <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/guide"
                    className="btn-glass inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-medium text-zinc-200"
                  >
                    Read the Guide
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
                <p className="mt-6 text-sm text-zinc-600">
                  ✨ Free forever plan available • No credit card • 14-day premium trial
                </p>
              </div>
            </div>
          </RevealBlur>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-white/[0.04] bg-[rgba(3,7,18,0.6)]">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <Link href="/" className="group flex items-center gap-3">
                  <div className="glow-ring flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/12">
                    <MessageSquare className="h-4 w-4 text-emerald-300" />
                  </div>
                  <span className="font-bold text-white">Signhify</span>
                </Link>
                <p className="mt-4 text-sm leading-relaxed text-zinc-500 max-w-xs">
                  The shared inbox and sales pipeline that turns WhatsApp conversations into organized, repeatable revenue for your team.
                </p>
                <div className="mt-6 flex gap-4">
                  {["About", "Blog", "Changelog"].map((item) => (
                    <a key={item} href="#" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
                      {item}
                    </a>
                  ))}
                </div>
              </div>

              {[
                {
                  title: "Product",
                  links: ["Features", "Pricing", "API", "Integrations", "Changelog"],
                },
                {
                  title: "Company",
                  links: ["About", "Blog", "Careers", "Contact", "Press Kit"],
                },
                {
                  title: "Legal",
                  links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"],
                },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
                  <ul className="space-y-3">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="divider-gradient mt-12 mb-8" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-zinc-600">
                &copy; 2026 Signhify CRM. Crafted with precision by{" "}
                <span className="text-zinc-400">Piyush Raj Singh</span>
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-600">Built on</span>
                <span className="text-xs text-zinc-500">Next.js</span>
                <span className="text-xs text-zinc-600">·</span>
                <span className="text-xs text-zinc-500">Supabase</span>
                <span className="text-xs text-zinc-600">·</span>
                <span className="text-xs text-zinc-500">Vercel</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
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
