'use client';

import { useState, useEffect } from 'react';
import {
  Mail, Plus, Send, Settings, BarChart3, CheckCircle2, XCircle,
  Loader2, FileText, Zap, Trash2, Play,
  ChevronRight, Bot, MessageSquare, Users2, Globe, ShieldCheck,
  Rocket, ArrowRight, Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  createdAt: string;
  scheduledAt?: string;
}

interface SmtpConfig {
  id?: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromName?: string;
  fromEmail?: string;
  isVerified?: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

type Tab = 'campaigns' | 'create' | 'templates' | 'smtp' | 'rules';

const TRIGGER_LABELS: Record<string, string> = {
  new_lead: 'New Lead Created',
  followup_due: 'Follow-up Due',
  stage_changed: 'Pipeline Stage Changed',
  deal_won: 'Deal Won',
  deal_lost: 'Deal Lost',
  weekly_report: 'Weekly Report',
  meeting_request: 'Meeting Requested',
  no_reply_24h: 'No Reply for 24h',
  custom: 'Custom Trigger',
};

export default function EmailAutomationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('campaigns');
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  
  // SMTP Config
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    fromName: '',
    fromEmail: '',
  });
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpSaved, setSmtpSaved] = useState(false);

  // New Campaign
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    bodyHtml: '',
    recipientFilter: '',
  });
  const [sending, setSending] = useState(false);

  // Automation Rules
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    trigger: 'new_lead',
    subject: '',
    bodyHtml: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campRes, smtpRes, rulesRes, tmplRes] = await Promise.all([
        api.get<{ campaigns: EmailCampaign[] }>('/email-campaigns').catch(() => ({ campaigns: [] })),
        api.get<{ config: SmtpConfig | null }>('/email-automation/smtp').catch(() => ({ config: null })),
        api.get<{ rules: AutomationRule[] }>('/email-automation/rules').catch(() => ({ rules: [] })),
        api.get<{ templates: Template[] }>('/email-campaigns/templates').catch(() => ({ templates: [] })),
      ]);

      setCampaigns(campRes.campaigns || []);
      if (smtpRes.config) setSmtpConfig(smtpRes.config);
      setRules(rulesRes.rules || []);
      setTemplates(tmplRes.templates || []);
    } catch (err) {
      console.error('Failed to load email automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── SMTP ─────────────────────────────────────────────────────

  const handleSaveSmtp = async () => {
    setSmtpLoading(true);
    try {
      const body: Record<string, unknown> = { ...smtpConfig };
      // Only include password if user actually entered a new one
      if (smtpPassword && smtpPassword.length > 0 && smtpPassword !== '********') {
        body.pass = smtpPassword;
      }
      await api.post('/email-automation/smtp', body);
      setSmtpSaved(true);
      setSmtpPassword('');
      setTimeout(() => setSmtpSaved(false), 3000);
      toast('success', 'SMTP configuration saved!');
    } catch (err: any) {
      toast('error', err.message || 'Failed to save SMTP config');
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!smtpTestEmail) {
      toast('error', 'Enter a test email address');
      return;
    }
    setSmtpTesting(true);
    try {
      await api.post('/email-automation/smtp/test', { email: smtpTestEmail });
      toast('success', `Test email sent to ${smtpTestEmail}!`);
    } catch (err: any) {
      toast('error', err.message || 'Test failed');
    } finally {
      setSmtpTesting(false);
    }
  };

  // ─── Campaigns ────────────────────────────────────────────────

  const handleUseTemplate = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setCampaignForm({
        ...campaignForm,
        subject: tmpl.subject.replace(/{{.*?}}/g, 'Your Subject'),
        bodyHtml: tmpl.body,
      });
      setActiveTab('create');
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject || !campaignForm.bodyHtml) {
      toast('error', 'Please fill in all required fields');
      return;
    }
    setSending(true);
    try {
      await api.post('/email-campaigns', campaignForm);
      toast('success', 'Campaign created!');
      setCampaignForm({ name: '', subject: '', bodyHtml: '', recipientFilter: '' });
      setActiveTab('campaigns');
      loadData();
    } catch (err: any) {
      toast('error', err.message || 'Failed to create campaign');
    } finally {
      setSending(false);
    }
  };

  const handleSendCampaign = async (id: string) => {
    try {
      await api.post(`/email-campaigns/${id}/send`, {});
      toast('success', 'Campaign sending started!');
      loadData();
    } catch (err: any) {
      toast('error', err.message || 'Failed to send campaign');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/email-campaigns/${id}`);
      toast('success', 'Campaign deleted');
      loadData();
    } catch (err: any) {
      toast('error', err.message || 'Failed to delete');
    }
  };

  // ─── Automation Rules ─────────────────────────────────────────

  const handleCreateRule = async () => {
    if (!ruleForm.name || !ruleForm.subject || !ruleForm.bodyHtml) {
      toast('error', 'Please fill in all required fields');
      return;
    }
    try {
      await api.post('/email-automation/rules', ruleForm);
      toast('success', 'Automation rule created!');
      setShowRuleModal(false);
      setRuleForm({ name: '', trigger: 'new_lead', subject: '', bodyHtml: '', isActive: true });
      loadData();
    } catch (err: any) {
      toast('error', err.message || 'Failed to create rule');
    }
  };

  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      await api.patch(`/email-automation/rules/${rule.id}`, { isActive: !rule.isActive });
      loadData();
    } catch (err: any) {
      toast('error', err.message || 'Failed to update rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Delete this automation rule?')) return;
    try {
      await api.delete(`/email-automation/rules/${id}`);
      toast('success', 'Rule deleted');
      loadData();
    } catch (err: any) {
      toast('error', err.message || 'Failed to delete rule');
    }
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-zinc-500/20 text-zinc-400',
      scheduled: 'bg-blue-500/20 text-blue-400',
      sending: 'bg-yellow-500/20 text-yellow-400',
      sent: 'bg-emerald-500/20 text-emerald-400',
      failed: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-zinc-500/20 text-zinc-400';
  };

  const tabContent: Record<Tab, { label: string; icon: any }> = {
    campaigns: { label: 'Campaigns', icon: Mail },
    create: { label: 'New Campaign', icon: Plus },
    templates: { label: 'Templates', icon: FileText },
    smtp: { label: 'SMTP Settings', icon: Settings },
    rules: { label: 'Automation Rules', icon: Zap },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner-premium" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Mail className="w-6 h-6 text-emerald-400" />
            Email Automation
          </h1>
          <p className="text-zinc-500 mt-1">Send campaigns, automate notifications, and grow your pipeline</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-0.5 overflow-x-auto">
        {(Object.entries(tabContent) as [Tab, typeof tabContent[Tab]][]).map(([key, tab]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === key
                ? 'text-emerald-400 border-emerald-400'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── CAMPAIGNS TAB ─── */}
      {activeTab === 'campaigns' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="text-3xl font-bold text-white">{campaigns.length}</div>
              <div className="text-sm text-zinc-500 mt-1">Total Campaigns</div>
            </div>
            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="text-3xl font-bold text-green-400">
                {campaigns.reduce((s, c) => s + c.sentCount, 0)}
              </div>
              <div className="text-sm text-zinc-500 mt-1">Emails Sent</div>
            </div>
            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="text-3xl font-bold text-emerald-400">
                {campaigns.filter(c => c.status === 'sent').length}
              </div>
              <div className="text-sm text-zinc-500 mt-1">Completed</div>
            </div>
            <div className="glass-panel-strong rounded-2xl p-5">
              <div className="text-3xl font-bold text-zinc-300">
                {campaigns.reduce((s, c) => s + c.totalRecipients, 0)}
              </div>
              <div className="text-sm text-zinc-500 mt-1">Total Recipients</div>
            </div>
          </div>

          <div className="glass-panel-strong rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-semibold text-white">Email Campaigns</h3>
              <button
                onClick={() => setActiveTab('create')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" /> New Campaign
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="p-16 text-center">
                <Mail className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-400">No campaigns yet</h3>
                <p className="text-sm text-zinc-600 mt-2">Create your first email campaign to reach your contacts</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-6 px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Campaign
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-white truncate">{campaign.name}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 mt-1 truncate">{campaign.subject}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-600">
                          <span>{campaign.totalRecipients} recipients</span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500/60" />
                            {campaign.sentCount} sent
                          </span>
                          {campaign.failedCount > 0 && (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-red-500/60" />
                              {campaign.failedCount} failed
                            </span>
                          )}
                          <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {campaign.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleSendCampaign(campaign.id)}
                              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                              title="Send Campaign"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── CREATE TAB ─── */}
      {activeTab === 'create' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel-strong rounded-2xl p-6 space-y-5">
            <h3 className="font-semibold text-white text-lg">Campaign Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Campaign Name *</label>
              <input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                placeholder="e.g., March Newsletter" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email Subject *</label>
              <input value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                placeholder="e.g., Exclusive offers inside!" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">HTML Email Body *</label>
              <textarea value={campaignForm.bodyHtml} onChange={(e) => setCampaignForm({ ...campaignForm, bodyHtml: e.target.value })}
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none font-mono text-xs"
                rows={12} placeholder="<html>...</html>" />
              <p className="text-xs text-zinc-600 mt-2">
                Use {'{{name}}'}, {'{{email}}'}, {'{{company}}'} as personalization variables
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Recipient Filter (JSON)</label>
              <input value={campaignForm.recipientFilter} onChange={(e) => setCampaignForm({ ...campaignForm, recipientFilter: e.target.value })}
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                placeholder='{"stage":"won"} or leave empty for all contacts' />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleCreateCampaign} disabled={sending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Rocket className="w-4 h-4" /> Create Campaign</>}
              </button>
              <button onClick={() => setActiveTab('templates')}
                className="px-6 py-3 rounded-xl bg-white/[0.05] text-zinc-400 font-medium hover:bg-white/[0.08] transition-all">
                Browse Templates
              </button>
            </div>
          </div>

          <div className="glass-panel-strong rounded-2xl p-6">
            <h3 className="font-semibold text-white text-lg mb-4">Quick Tips</h3>
            <div className="space-y-4">
              {[
                { icon: Zap, text: 'Use templates from the Templates tab to get started quickly', color: 'text-amber-400' },
                { icon: Users2, text: 'Filter recipients by stage (won, negotiation) or tag', color: 'text-blue-400' },
                { icon: Globe, text: 'Personalize with {{name}}, {{company}}, {{year}} variables', color: 'text-emerald-400' },
                { icon: ShieldCheck, text: 'Always send a test email before launching campaigns', color: 'text-purple-400' },
              ].map((tip) => (
                <div key={tip.text} className="flex items-start gap-3 text-sm">
                  <tip.icon className={`w-4 h-4 ${tip.color} mt-0.5`} />
                  <span className="text-zinc-400">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TEMPLATES TAB ─── */}
      {activeTab === 'templates' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="glass-panel-strong rounded-2xl p-6 card-hover-premium">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-400/5 border border-emerald-400/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white text-lg">{tmpl.name}</h3>
              <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{tmpl.subject}</p>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={() => handleUseTemplate(tmpl.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all">
                  Use Template <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── SMTP TAB ─── */}
      {activeTab === 'smtp' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel-strong rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white text-lg">SMTP Configuration</h3>
              {smtpConfig.isVerified && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">✓ Verified</span>
              )}
            </div>
            <p className="text-sm text-zinc-500">Configure your email server to send campaigns and automated emails.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">SMTP Host</label>
                <input value={smtpConfig.host} onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                  placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Port</label>
                <input type="number" value={smtpConfig.port} onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                  className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Username / Email</label>
                <input value={smtpConfig.user} onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                  placeholder="you@gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Password / App Password</label>
                <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)}
                  className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                  placeholder="Leave empty to keep current" />
                <p className="text-xs text-zinc-600 mt-1">Leave empty to keep your existing password</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">From Name</label>
                <input value={smtpConfig.fromName || ''} onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                  className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                  placeholder="Your Business Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">From Email</label>
                <input value={smtpConfig.fromEmail || ''} onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                  className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                  placeholder="newsletter@yourdomain.com" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={smtpConfig.secure} onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                  className="rounded border-zinc-700" />
                Use SSL/TLS (port 465)
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSaveSmtp} disabled={smtpLoading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                {smtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {smtpSaved ? 'Saved!' : 'Save Configuration'}
              </button>
            </div>
          </div>

          <div className="glass-panel-strong rounded-2xl p-6 space-y-5">
            <h3 className="font-semibold text-white text-lg">Test Connection</h3>
            <p className="text-sm text-zinc-500">Send a test email to verify your SMTP configuration works.</p>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Send Test To</label>
              <input value={smtpTestEmail} onChange={(e) => setSmtpTestEmail(e.target.value)}
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                placeholder="your@email.com" />
            </div>

            <button onClick={handleTestSmtp} disabled={smtpTesting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 text-blue-400 font-medium hover:bg-blue-500/20 transition-all disabled:opacity-50">
              {smtpTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Test Email
            </button>

            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <h4 className="text-sm font-medium text-zinc-300">Gmail Setup Guide</h4>
              <ol className="text-xs text-zinc-500 space-y-2">
                <li>1. Enable 2-Step Verification in your Google Account</li>
                <li>2. Generate an App Password (Google Account → Security → App Passwords)</li>
                <li>3. Use smtp.gmail.com, port 587</li>
                <li>4. Use your full email as username</li>
                <li>5. Use the 16-char App Password as password</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ─── AUTOMATION RULES TAB ─── */}
      {activeTab === 'rules' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Automatically send emails when specific events happen in your CRM</p>
            <button onClick={() => setShowRuleModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all">
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>

          <div className="glass-panel-strong rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]"><h3 className="font-semibold text-white">Automation Rules</h3></div>
            {rules.length === 0 ? (
              <div className="p-16 text-center">
                <Zap className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-400">No automation rules yet</h3>
                <p className="text-sm text-zinc-600 mt-2">Create rules to send automatic emails on important events</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-white">{rule.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs text-zinc-400">
                          {TRIGGER_LABELS[rule.trigger] || rule.trigger}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1 truncate max-w-lg">{rule.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleRule(rule)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${rule.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel-strong rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Available Triggers</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm text-white">{label}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {key === 'new_lead' && 'When a new lead is created'}
                      {key === 'followup_due' && 'When a follow-up becomes due'}
                      {key === 'stage_changed' && 'When a contact moves stages'}
                      {key === 'deal_won' && 'When a deal is marked as won'}
                      {key === 'deal_lost' && 'When a deal is marked as lost'}
                      {key === 'weekly_report' && 'Send weekly performance summary'}
                      {key === 'meeting_request' && 'When a meeting is requested'}
                      {key === 'no_reply_24h' && 'No customer response in 24 hours'}
                      {key === 'custom' && 'Custom trigger via API'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── RULE MODAL ─── */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[rgba(3,7,18,0.95)] backdrop-blur-2xl p-6 space-y-5">
            <h3 className="font-semibold text-white text-lg">Create Automation Rule</h3>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Rule Name</label>
              <input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                placeholder="e.g., Welcome Email for New Leads" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Trigger Event</label>
              <select value={ruleForm.trigger} onChange={(e) => setRuleForm({ ...ruleForm, trigger: e.target.value })}
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white focus:outline-none">
                {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                  <option key={key} value={key} className="bg-zinc-900">{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email Subject</label>
              <input value={ruleForm.subject} onChange={(e) => setRuleForm({ ...ruleForm, subject: e.target.value })}
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none"
                placeholder="e.g., Welcome {{name}}!" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email HTML Body</label>
              <textarea value={ruleForm.bodyHtml} onChange={(e) => setRuleForm({ ...ruleForm, bodyHtml: e.target.value })}
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none font-mono text-xs"
                rows={6} placeholder="<html>...</html>" />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleCreateRule}
                className="px-6 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-all">Create Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
