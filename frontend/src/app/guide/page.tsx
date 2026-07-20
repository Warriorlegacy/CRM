import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Zap, Smartphone, MessageSquare, Bot, ShieldCheck, Users, 
  ArrowRight, CheckCircle2, HelpCircle, Search, Play, Sparkles, BookOpen, Layers,
  Star, ChevronRight, Rocket, Gauge, Globe, Trophy
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'User Guide & 1-Click Setup Manual | Signhify CRM & Automation',
  description: 'Complete non-technical step-by-step guide for setting up Signhify CRM, WhatsApp, Instagram DMs, AI Auto-responders, and multi-agent sales pipelines in 1 click.',
  keywords: [
    'Signhify CRM',
    'WhatsApp CRM',
    'WhatsApp Automation',
    'Instagram Inbox CRM',
    'WhatsApp AI Auto Responder',
    'Multi Agent WhatsApp Inbox',
    'WhatsApp Sales Pipeline',
    'Signhify CRM Setup Guide',
  ],
  openGraph: {
    title: 'Signhify CRM User Guide & 1-Click Setup Manual',
    description: 'Learn how to turn WhatsApp chats into organized revenue with zero coding required.',
    url: 'https://whatsapp-crm-frontend-three.vercel.app/guide',
    siteName: 'Signhify CRM',
    type: 'article',
  },
};

export default function UserGuidePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        'name': 'How do I connect WhatsApp to the CRM in 1 click?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Go to Settings or Setup, click "Connect WhatsApp", and sign in with your Facebook/Meta account. The CRM automatically links your Phone Number ID and Webhooks without manual coding.',
        },
      },
      {
        '@type': 'Question',
        'name': 'Do I need developer skills to set up WhatsApp automation?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'No. The entire platform is built for non-technical business owners and sales managers. You can drag and drop sales stages, pick pre-built AI chatbot templates, and invite teammates with simple buttons.',
        },
      },
      {
        '@type': 'Question',
        'name': 'Can multiple agents manage the same WhatsApp number?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes. The unified multi-agent inbox includes live collision warnings so two team members never reply to the same customer simultaneously.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[rgba(3,7,18,0.80)] backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-white">
              Signhify
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal ml-2">
                by Piyush Raj Singh
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="group relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white btn-gradient overflow-hidden">
              <span className="relative z-10">Start Free Trial</span>
              <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="py-16 sm:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/8 border border-emerald-400/20 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Non-Technical Business Operator Guide
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
            Master WhatsApp CRM &{" "}
            <span className="gradient-text">Automate Sales</span>
            <br />
            In 3 Minutes
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
            A complete 1-click setup guide for business owners, sales teams, and customer support reps. 
            <span className="text-zinc-300 font-medium"> Zero coding. Zero technical experience required.</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <BookOpen className="h-4 w-4" />
            <span>12-step guide</span>
            <span className="text-zinc-700">·</span>
            <Gauge className="h-4 w-4" />
            <span>3 min read</span>
            <span className="text-zinc-700">·</span>
            <Globe className="h-4 w-4" />
            <span>Zero code</span>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-20">
        
        {/* Step 1: 1-Click Setup */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 border border-emerald-400/20 flex items-center justify-center">
              <span className="text-xl font-bold text-emerald-400">1</span>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">1-Click WhatsApp & Meta Setup</h2>
              <p className="text-zinc-500 text-sm mt-1">No webhooks to configure. No code to paste. Just click and connect.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "1", title: "Create Account", desc: "Sign up with 1-Click Google Auth or Work Email. Your personal workspace is initialized instantly.", color: "from-emerald-400/20" },
              { num: "2", title: 'Click "Connect Meta"', desc: "Log in with your Facebook/Meta account in the popup dialog. Grant access to your WhatsApp Business Number.", color: "from-sky-400/20" },
              { num: "3", title: "Start Chatting", desc: "Incoming messages arrive live in your shared Inbox. Webhooks and message routes are pre-configured automatically.", color: "from-purple-400/20" },
            ].map((step) => (
              <div key={step.num} className="glass-panel-strong rounded-2xl p-6 space-y-4 card-hover-premium">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} border border-white/[0.06] flex items-center justify-center font-bold text-white`}>
                  {step.num}
                </div>
                <h3 className="font-semibold text-white text-lg">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Step 2: Everyday Usage */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400/20 to-sky-400/5 border border-sky-400/20 flex items-center justify-center">
              <span className="text-xl font-bold text-sky-400">2</span>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Everyday Workspace Features</h2>
              <p className="text-zinc-500 text-sm mt-1">Managing chats, teammates, and sales stages seamlessly — no training required.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: MessageSquare, title: "Unified Team Inbox", desc: "All WhatsApp and Instagram conversations land in one inbox. View assigned reps, internal notes, customer tags, and quick-reply templates.", color: "text-emerald-400" },
              { icon: Layers, title: "Drag & Drop Pipeline", desc: "Move leads through custom stages (New Lead → Follow-up → Negotiation → Won) by simply dragging cards across columns.", color: "text-purple-400" },
              { icon: Bot, title: "AI Auto-Responders", desc: "Add your choice of AI keys (Gemini, OpenAI, Anthropic, or free Groq) to handle automatic greetings, FAQ replies, and lead qualification.", color: "text-amber-400" },
              { icon: Users, title: "Team Collision Prevention", desc: "Real-time indicators notify your team if two representatives are looking at or typing in the same chat, eliminating duplicated work.", color: "text-pink-400" },
              { icon: ShieldCheck, title: "Role-Based Access", desc: "Admins control who sees what. Agents focus on conversations. Every action is tracked and auditable.", color: "text-cyan-400" },
              { icon: Trophy, title: "Performance Analytics", desc: "See response times, conversion rates, and team velocity on live dashboards. What gets measured gets improved.", color: "text-amber-400" },
            ].map((feature) => (
              <div key={feature.title} className="glass-panel-strong rounded-2xl p-6 space-y-3 card-hover-premium">
                <div className={`flex items-center gap-3 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                  <h3 className="font-semibold text-white text-lg">{feature.title}</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Start Video Section */}
        <section className="glass-panel-strong rounded-[32px] p-8 sm:p-12 border-gradient">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/8 border border-emerald-400/20 px-3 py-1.5 mb-4">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300">Video Walkthrough</span>
              </div>
              <h2 className="text-3xl font-bold text-white">See it in action</h2>
              <p className="mt-3 text-zinc-400 text-base leading-relaxed">
                Watch how a sales team goes from messy WhatsApp to organized pipeline in under 60 seconds. 
                No fluff, no filler — just results.
              </p>
            </div>
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold text-white btn-gradient overflow-hidden"
            >
              <span className="relative z-10">Start Your Free Trial</span>
              <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Questions? <span className="gradient-text">We've got answers.</span>
            </h2>
            <p className="text-zinc-400 text-sm">Everything you need to know to get started</p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {jsonLd.mainEntity.map((faq, i) => (
              <div key={i} className="glass-panel-strong rounded-2xl p-6 space-y-3 card-hover-premium">
                <h3 className="font-semibold text-white text-base flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  {faq.name}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed pl-8">
                  {faq.acceptedAnswer.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="glass-panel-strong rounded-[36px] p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/8 px-4 py-2 text-sm text-emerald-200/80">
              <Rocket className="h-4 w-4" />
              Start Automating Your Sales Today
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Ready to turn WhatsApp chats into{" "}
              <span className="gradient-text">repeatable revenue?</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">
              Join thousands of businesses scaling customer conversations into closed deals. 
              No credit card required.
            </p>
            <div className="flex justify-center">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold text-white btn-gradient overflow-hidden"
              >
                <span className="relative z-10">Get Started Free</span>
                <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.04] bg-[rgba(3,7,18,0.6)]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-bold text-white">Signhify</span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                The shared inbox and pipeline that turns WhatsApp conversations into revenue.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Product</h4>
              <ul className="mt-3 space-y-2">
                <li><a href="#features" className="text-sm text-zinc-500 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-zinc-500 hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/register" className="text-sm text-zinc-500 hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Company</h4>
              <ul className="mt-3 space-y-2">
                <li><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Legal</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/privacy" className="text-sm text-zinc-500 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-zinc-500 hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="divider-gradient mt-10 mb-6" />
          
          <div className="text-center text-sm text-zinc-600">
            &copy; 2026 Signhify CRM. Crafted with precision by Piyush Raj Singh.
          </div>
        </div>
      </footer>
    </div>
  );
}
