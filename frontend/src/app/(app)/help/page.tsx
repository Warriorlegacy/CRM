'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, BookOpen, MessageSquare, Users, Kanban, Bot, Brain, Zap,
  Smartphone, Settings, Shield, ChevronRight, ExternalLink, Sparkles,
  HelpCircle, FileText, Mail, Webhook, Video, Star, Clock, Bell, Rocket
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  href: string;
  readTime: string;
}

const ARTICLES: Article[] = [
  // Getting Started
  { id: 'gs-1', title: 'Quick Start Guide: Set up in 3 Minutes', description: 'Connect WhatsApp, invite your team, and send your first message — all in under 3 minutes.', category: 'Getting Started', icon: Rocket, href: '/guide', readTime: '3 min' },
  { id: 'gs-2', title: 'Connect WhatsApp Business', description: 'One-click Meta OAuth to link your WhatsApp Business number with Signhify.', category: 'Getting Started', icon: Smartphone, href: '/settings', readTime: '2 min' },
  { id: 'gs-3', title: 'Connect Instagram', description: 'Link your Instagram Business account for unified multi-channel messaging.', category: 'Getting Started', icon: MessageSquare, href: '/settings', readTime: '2 min' },
  { id: 'gs-4', title: 'Invite Your Team', description: 'Add team members as admins or agents to collaborate on conversations.', category: 'Getting Started', icon: Users, href: '/team', readTime: '1 min' },

  // Inbox & Messaging
  { id: 'in-1', title: 'Master the Unified Inbox', description: 'Everything about managing conversations across WhatsApp and Instagram in one place.', category: 'Inbox & Messaging', icon: MessageSquare, href: '/inbox', readTime: '5 min' },
  { id: 'in-2', title: 'Agent Collision Prevention', description: 'How the lock system prevents two agents from replying to the same customer.', category: 'Inbox & Messaging', icon: Shield, href: '/inbox', readTime: '2 min' },
  { id: 'in-3', title: 'Send Media & Attachments', description: 'Share images, documents, and files in your conversations.', category: 'Inbox & Messaging', icon: FileText, href: '/inbox', readTime: '2 min' },
  { id: 'in-4', title: 'Use Quick Templates', description: 'Save time with pre-written message templates and variables.', category: 'Inbox & Messaging', icon: Zap, href: '/templates', readTime: '3 min' },
  { id: 'in-5', title: 'Internal Notes & Mentions', description: 'Collaborate with your team using internal notes and @mentions on conversations.', category: 'Inbox & Messaging', icon: FileText, href: '/inbox', readTime: '2 min' },

  // Pipeline & Sales
  { id: 'pl-1', title: 'Sales Pipeline Guide', description: 'Drag-and-drop your leads through stages from New to Closed Won.', category: 'Pipeline & Sales', icon: Kanban, href: '/pipeline', readTime: '4 min' },
  { id: 'pl-2', title: 'Lead Scoring System', description: 'How automatic lead scoring works and how to interpret scores.', category: 'Pipeline & Sales', icon: Brain, href: '/contacts', readTime: '3 min' },
  { id: 'pl-3', title: 'Manage Follow-ups', description: 'Create, track, and complete follow-up reminders for every contact.', category: 'Pipeline & Sales', icon: Clock, href: '/followups', readTime: '3 min' },
  { id: 'pl-4', title: 'Conversation Tags', description: 'Organize conversations with color-coded tags for better filtering.', category: 'Pipeline & Sales', icon: Star, href: '/inbox', readTime: '2 min' },

  // AI & Automation
  { id: 'ai-1', title: 'AI Configuration Guide', description: 'Add multiple AI providers with automatic fallback for reliable auto-replies.', category: 'AI & Automation', icon: Brain, href: '/ai', readTime: '5 min' },
  { id: 'ai-2', title: 'Build Chatbot Flows', description: 'Create visual chatbot flows with messages, questions, conditions, and actions.', category: 'AI & Automation', icon: Bot, href: '/chatbot', readTime: '6 min' },
  { id: 'ai-3', title: 'Set Up Auto-Responders', description: 'Automate responses based on keywords, new contacts, or no-reply triggers.', category: 'AI & Automation', icon: Zap, href: '/automation', readTime: '4 min' },
  { id: 'ai-4', title: 'AI Smart Replies', description: 'Use AI-generated reply suggestions to respond faster in conversations.', category: 'AI & Automation', icon: Sparkles, href: '/inbox', readTime: '2 min' },
  { id: 'ai-5', title: 'Email Campaigns & Automation', description: 'Create, schedule, and send professional email campaigns with automation rules.', category: 'AI & Automation', icon: Mail, href: '/email-automation', readTime: '6 min' },

  // Settings & Configuration
  { id: 'st-1', title: 'Business Hours & Away Messages', description: 'Configure working hours and automatic away messages for after-hours.', category: 'Settings & Configuration', icon: Settings, href: '/settings', readTime: '4 min' },
  { id: 'st-2', title: 'Multi-Language AI Support', description: 'Enable automatic language detection and configure supported languages.', category: 'Settings & Configuration', icon: HelpCircle, href: '/settings', readTime: '3 min' },
  { id: 'st-3', title: 'Notification Preferences', description: 'Configure browser, sound, and email notifications for your workspace.', category: 'Settings & Configuration', icon: Bell, href: '/settings', readTime: '2 min' },
  { id: 'st-4', title: 'Webhook Logs & Debugging', description: 'View and debug incoming webhook events from WhatsApp and Instagram.', category: 'Settings & Configuration', icon: Webhook, href: '/webhooks', readTime: '2 min' },
];

const CATEGORIES = [
  { id: 'Getting Started', icon: Rocket, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { id: 'Inbox & Messaging', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'Pipeline & Sales', icon: Kanban, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'AI & Automation', icon: Brain, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { id: 'Settings & Configuration', icon: Settings, color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = ARTICLES.slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
          <BookOpen className="w-3.5 h-3.5" />
          Knowledge Base
        </div>
        <h1 className="text-3xl font-bold text-white">How can we help you?</h1>
        <p className="text-zinc-500 mt-2">Search our knowledge base for guides, tutorials, and answers</p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for help articles..."
          className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 outline-none focus:border-emerald-500/30 focus:shadow-[0_0_30px_rgba(65,211,155,0.06)] transition-all"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm transition-all ${
            !selectedCategory ? 'bg-white text-black font-medium' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          All Articles
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              selectedCategory === cat.id
                ? `${cat.bg} ${cat.color} font-medium`
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.id}
          </button>
        ))}
      </div>

      {/* Featured Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {featuredArticles.map((article) => (
          <Link
            key={article.id}
            href={article.href}
            className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all group"
          >
            <article.icon className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-medium text-white mb-1">{article.title}</h3>
            <p className="text-xs text-zinc-500">{article.readTime} read</p>
          </Link>
        ))}
      </div>

      {/* Category Sections */}
      {!searchQuery && !selectedCategory && (
        <div className="space-y-8">
          {CATEGORIES.map((cat) => {
            const catArticles = ARTICLES.filter((a) => a.category === cat.id);
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl ${cat.bg}`}>
                    <cat.icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{cat.id}</h2>
                  <span className="text-xs text-zinc-600">{catArticles.length} articles</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={article.href}
                      className="flex items-start gap-4 p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${cat.bg} group-hover:scale-105 transition-transform`}>
                        <article.icon className={`w-4 h-4 ${cat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{article.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-zinc-600">{article.readTime} read</span>
                          <ChevronRight className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">{filteredArticles.length} results for "{searchQuery}"</p>
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => {
              const catConfig = CATEGORIES.find((c) => c.id === article.category);
              return (
                <Link
                  key={article.id}
                  href={article.href}
                  className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all group"
                >
                  <div className={`p-2 rounded-lg shrink-0 ${catConfig?.bg || 'bg-zinc-500/20'}`}>
                    <article.icon className={`w-4 h-4 ${catConfig?.color || 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-600">{article.category}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-600">{article.readTime} read</span>
                    </div>
                    <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{article.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                </Link>
              );
            })
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">No results found for "{searchQuery}"</p>
              <p className="text-sm text-zinc-600 mt-1">Try different keywords or browse categories</p>
            </div>
          )}
        </div>
      )}

      {/* Need More Help */}
      <div className="glass-panel-strong rounded-2xl p-6 text-center">
        <HelpCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">Still need help?</h3>
        <p className="text-sm text-zinc-500 mb-4">Contact the creator Piyush Raj Singh for direct support</p>
        <a
          href="mailto:piyushrajsingh092@gmail.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
        >
          <Mail className="w-4 h-4" />
          Get Support
        </a>
      </div>

      {/* Quick Video Walkthrough */}
      <div className="glass-panel-strong rounded-2xl overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
              <Video className="w-3.5 h-3.5" />
              Video Guide
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Watch the Full Walkthrough
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              See how to set up Signhify CRM in 3 minutes — from connecting WhatsApp to closing your first deal.
            </p>
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Guide
            </Link>
          </div>
          <div className="w-full md:w-64 h-40 rounded-2xl bg-gradient-to-br from-emerald-900/40 via-zinc-900 to-purple-900/40 border border-zinc-800 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl ml-1">▶</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
