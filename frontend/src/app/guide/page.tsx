import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Zap, Smartphone, MessageSquare, Bot, ShieldCheck, Users, 
  ArrowRight, CheckCircle2, HelpCircle, Search, Play, Sparkles, BookOpen, Layers
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
        name: 'How do I connect WhatsApp to the CRM in 1 click?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Go to Settings or Setup, click "Connect WhatsApp", and sign in with your Facebook/Meta account. The CRM automatically links your Phone Number ID and Webhooks without manual coding.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need developer skills to set up WhatsApp automation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. The entire platform is built for non-technical business owners and sales managers. You can drag and drop sales stages, pick pre-built AI chatbot templates, and invite teammates with simple buttons.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can multiple agents manage the same WhatsApp number?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The unified multi-agent inbox includes live collision warnings so two team members never reply to the same customer simultaneously.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Header Nav */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white">Signhify CRM <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal ml-2 font-mono">by Piyush Raj Singh</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="py-16 px-4 bg-gradient-to-b from-zinc-900/80 to-zinc-950 border-b border-zinc-800/80">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Non-Technical Business Operator Guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            How To Master WhatsApp CRM & Automate Sales In 3 Minutes
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            A complete 1-click setup guide for business owners, sales teams, and customer support reps. Zero coding or technical experience required.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        
        {/* Step 1: 1-Click Setup */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">1</div>
            <div>
              <h2 className="text-2xl font-bold text-white">1-Click WhatsApp & Meta Setup</h2>
              <p className="text-zinc-400 text-sm">No webhooks to configure, no code to paste.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-semibold text-white">Create Account</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Sign up with 1-Click Google Auth or Work Email. Your personal workspace is initialized instantly.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-semibold text-white">Click "Connect Meta"</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Log in with your Facebook/Meta account in the popup dialog. Grant access to your WhatsApp Business Number.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-semibold text-white">Start Chatting</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Incoming messages arrive live in your shared Inbox. Webhooks and message routes are pre-configured.
              </p>
            </div>
          </div>
        </section>

        {/* Step 2: Everyday Usage */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">2</div>
            <div>
              <h2 className="text-2xl font-bold text-white">Everyday Workspace Features</h2>
              <p className="text-zinc-400 text-sm">Managing chats, teammates, and sales stages seamlessly.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400">
                <MessageSquare className="w-6 h-6" />
                <h3 className="font-semibold text-white text-lg">Unified Team Inbox</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                All WhatsApp and Instagram conversations land in one inbox. View assigned reps, internal notes, customer tags, and quick-reply templates.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3 text-purple-400">
                <Layers className="w-6 h-6" />
                <h3 className="font-semibold text-white text-lg">Drag & Drop Pipeline</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Move leads through custom stages (New Lead → Follow-up → Negotiation → Won) by simply dragging cards across columns.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3 text-amber-400">
                <Bot className="w-6 h-6" />
                <h3 className="font-semibold text-white text-lg">AI Auto-Responders</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Add your choice of AI keys (Gemini, OpenAI, Anthropic, or free Groq) to handle automatic greetings, FAQ replies, and lead qualification.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3 text-pink-400">
                <Users className="w-6 h-6" />
                <h3 className="font-semibold text-white text-lg">Team Collision Prevention</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Real-time indicators notify your team if two representatives are looking at or typing in the same chat, eliminating duplicated work.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-6 border-t border-zinc-800 pt-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-zinc-400 text-sm">Quick answers for business managers</p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {jsonLd.mainEntity.map((faq, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-2">
                <h3 className="font-semibold text-white text-base flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  {faq.name}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed pl-7">
                  {faq.acceptedAnswer.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-gradient-to-r from-emerald-900/40 to-zinc-900 border border-emerald-500/20 rounded-3xl p-10 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to automate your WhatsApp sales?</h2>
          <p className="text-zinc-300 max-w-xl mx-auto text-sm">
            Join thousands of businesses scaling customer conversations into repeatable revenue.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        <p>© 2026 WhatsApp CRM. All rights reserved. Built for high performance on Vercel & Supabase.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/privacy" className="hover:text-zinc-400">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-zinc-400">Terms of Service</Link>
          <Link href="/sitemap.xml" className="hover:text-zinc-400">Sitemap</Link>
        </div>
      </footer>
    </div>
  );
}
