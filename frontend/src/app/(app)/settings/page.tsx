'use client';

import { useState, useEffect } from 'react';
import { api, API_ORIGIN, buildOAuthUrl, establishOAuthContext } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Settings, Bell, Smartphone, Check, AlertTriangle, Bot, Trash2, Plus, Instagram,
  RefreshCw, Loader2, Clock, MessageSquare, Globe
} from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  wa?: {
    phoneNumberId: string | null;
    businessAccountId: string | null;
  } | null;
  ig?: {
    igUserId: string | null;
  } | null;
}

interface Autoresponder {
  id: string;
  name: string;
  trigger: string;
  keyword: string | null;
  delayMinutes: number;
  message: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'whatsapp' | 'instagram' | 'notifications' | 'autoresponders' | 'businessHours' | 'languages'>('general');
  const [autoresponders, setAutoresponders] = useState<Autoresponder[]>([]);
  const [oauthStatus, setOauthStatus] = useState<{
    whatsapp: { connected: boolean; phoneNumberId: string | null; webhookUrl: string | null; webhookVerifyToken: string | null };
    instagram: { connected: boolean; igUserId: string | null; webhookUrl: string | null; webhookVerifyToken: string | null };
  } | null>(null);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    workspaceName: '',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    webhookVerifyToken: '',
    igUserId: '',
    igAccessToken: '',
    igWebhookVerifyToken: '',
    emailNotifications: true,
    browserNotifications: true,
    soundEnabled: true,
  });

  const [businessHoursEnabled, setBusinessHoursEnabled] = useState(false);
  const [businessHours, setBusinessHours] = useState<Record<string, [string, string]>>({
    mon: ['09:00', '18:00'],
    tue: ['09:00', '18:00'],
    wed: ['09:00', '18:00'],
    thu: ['09:00', '18:00'],
    fri: ['09:00', '18:00'],
  });

  const [awayMessages, setAwayMessages] = useState<Array<{
    id: string;
    message: string;
    isActive: boolean;
    priority: number;
    showWhenNoAgent: boolean;
  }>>([]);

  const [languageSettings, setLanguageSettings] = useState({
    defaultLanguage: 'en',
    autoDetect: true,
    enabledLanguages: ['en', 'hi', 'es', 'pt', 'fr', 'de', 'ar', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'ur', 'zh', 'ja', 'ko', 'ru', 'it', 'nl', 'tr', 'id', 'ms', 'th', 'vi'],
  });

  const [newAwayMessage, setNewAwayMessage] = useState({
    message: '',
    isActive: true,
    priority: 0,
    showWhenNoAgent: false,
  });

  const [newResponder, setNewResponder] = useState({
    name: '',
    trigger: 'keyword',
    keyword: '',
    delayMinutes: 0,
    message: '',
    isActive: true,
  });

  const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ar', name: 'Arabic' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ru', name: 'Russian' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'tr', name: 'Turkish' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ms', name: 'Malay' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
  ];

  useEffect(() => {
    if (authLoading) return;
    loadWorkspace();
    loadAutoresponders();
    loadOauthStatus();
    loadBusinessHours();
    loadAwayMessages();
  }, [authLoading]);

  const loadWorkspace = async () => {
    try {
      const data = await api.get<{ workspace: Workspace }>('/workspaces/current');
      setSettings(prev => ({
        ...prev,
        workspaceName: data.workspace.name,
        phoneNumberId: data.workspace.wa?.phoneNumberId || '',
        businessAccountId: data.workspace.wa?.businessAccountId || '',
        igUserId: data.workspace.ig?.igUserId || '',
      }));
    } catch (error) {
      console.error('Failed to load workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAutoresponders = async () => {
    try {
      const data = await api.get<{ responders: Autoresponder[] }>('/autoresponders');
      setAutoresponders(data.responders);
    } catch (error) {
      console.error('Failed to load autoresponders:', error);
    }
  };

  const loadOauthStatus = async () => {
    try {
      const status = await api.get<{
        whatsapp: { connected: boolean; phoneNumberId: string | null; webhookUrl: string | null; webhookVerifyToken: string | null };
        instagram: { connected: boolean; igUserId: string | null; webhookUrl: string | null; webhookVerifyToken: string | null };
      }>('/oauth/status');
      setOauthStatus(status);
    } catch (error) {
      console.error('Failed to load OAuth status:', error);
    }
  };

  const loadBusinessHours = async () => {
    try {
      const data = await api.get<{
        ok: boolean;
        businessHoursEnabled: boolean;
        businessHoursJson: Record<string, [string, string]>;
      }>('/workspaces/business-hours');
      setBusinessHoursEnabled(data.businessHoursEnabled);
      setBusinessHours(data.businessHoursJson || {});
    } catch (error) {
      console.error('Failed to load business hours:', error);
    }
  };

  const loadAwayMessages = async () => {
    try {
      const data = await api.get<{ ok: boolean; awayMessages: Array<{
        id: string;
        message: string;
        isActive: boolean;
        priority: number;
        showWhenNoAgent: boolean;
        createdAt: string;
        updatedAt: string;
      }> }>('/workspaces/away-messages');
      setAwayMessages(data.awayMessages);
    } catch (error) {
      console.error('Failed to load away messages:', error);
    }
  };

  const handleOAuthConnect = async (channel: 'whatsapp' | 'instagram') => {
    setConnectingChannel(channel);
    try {
      await establishOAuthContext(channel);
      window.location.href = buildOAuthUrl(channel);
    } catch {
      setConnectingChannel(null);
    }
  };

  const handleOAuthDisconnect = async (channel: string) => {
    if (!confirm('Disconnect ' + channel + '?')) return;
    await api.delete('/oauth/disconnect/' + channel);
    loadOauthStatus();
    loadWorkspace();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'general') {
        await api.patch('/workspaces/current', { name: settings.workspaceName });
        showSuccess('Workspace settings saved');
      } else if (activeTab === 'whatsapp') {
        await api.post('/workspaces/wa-account', {
          phoneNumberId: settings.phoneNumberId,
          businessAccountId: settings.businessAccountId,
          accessToken: settings.accessToken,
          webhookVerifyToken: settings.webhookVerifyToken,
        });
        showSuccess('WhatsApp settings saved');
        loadOauthStatus();
        loadWorkspace();
      } else if (activeTab === 'instagram') {
        await api.post('/workspaces/ig-account', {
          igUserId: settings.igUserId,
          accessToken: settings.igAccessToken,
          webhookVerifyToken: settings.igWebhookVerifyToken,
        });
        showSuccess('Instagram settings saved');
        loadOauthStatus();
        loadWorkspace();
      } else if (activeTab === 'businessHours') {
        await handleSaveBusinessHours();
      } else if (activeTab === 'languages') {
        showSuccess('Language settings saved');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAutoresponder = async () => {
    try {
      await api.post('/autoresponders', newResponder);
      showSuccess('Autoresponder created');
      setNewResponder({
        name: '',
        trigger: 'keyword',
        keyword: '',
        delayMinutes: 0,
        message: '',
        isActive: true,
      });
      loadAutoresponders();
    } catch (error) {
      console.error('Failed to create autoresponder:', error);
    }
  };

  const handleDeleteAutoresponder = async (id: string) => {
    if (!confirm('Delete this autoresponder?')) return;
    try {
      await api.delete(`/autoresponders/${id}`);
      loadAutoresponders();
    } catch (error) {
      console.error('Failed to delete autoresponder:', error);
    }
  };

  const handleSaveBusinessHours = async () => {
    try {
      await api.patch('/workspaces/business-hours', {
        enabled: businessHoursEnabled,
        hours: businessHours,
      });
      showSuccess('Business hours saved');
    } catch (error) {
      console.error('Failed to save business hours:', error);
    }
  };

  const handleUpdateBusinessHour = (day: string, field: 'start' | 'end', value: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: field === 'start'
        ? [value, prev[day]?.[1] || '18:00']
        : [prev[day]?.[0] || '09:00', value],
    }));
  };

  const handleToggleDay = (day: string) => {
    setBusinessHours(prev => {
      const next = { ...prev };
      if (next[day]) {
        delete next[day];
      } else {
        next[day] = ['09:00', '18:00'];
      }
      return next;
    });
  };

  const handleCreateAwayMessage = async () => {
    try {
      await api.post('/workspaces/away-messages', newAwayMessage);
      showSuccess('Away message created');
      setNewAwayMessage({ message: '', isActive: true, priority: 0, showWhenNoAgent: false });
      loadAwayMessages();
    } catch (error) {
      console.error('Failed to create away message:', error);
    }
  };

  const handleDeleteAwayMessage = async (id: string) => {
    if (!confirm('Delete this away message?')) return;
    try {
      await api.delete(`/workspaces/away-messages/${id}`);
      loadAwayMessages();
    } catch (error) {
      console.error('Failed to delete away message:', error);
    }
  };

  const handleToggleAwayMessageActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/workspaces/away-messages/${id}`, { isActive: !isActive });
      loadAwayMessages();
    } catch (error) {
      console.error('Failed to toggle away message:', error);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'businessHours', label: 'Business Hours', icon: Clock },
    { id: 'autoresponders', label: 'Auto-Responders', icon: Bot },
    { id: 'languages', label: 'Languages', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-zinc-500">Manage your workspace and preferences</p>
        </div>
        {successMessage && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}
      </div>

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'general' | 'whatsapp' | 'instagram' | 'notifications' | 'autoresponders' | 'businessHours' | 'languages')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">General Settings</h2>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Workspace Name</label>
                <input
                  type="text"
                  value={settings.workspaceName}
                  onChange={(e) => setSettings({ ...settings, workspaceName: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">WhatsApp Configuration</h2>
              
              {/* Connection Status */}
              {settings.phoneNumberId || oauthStatus?.whatsapp.connected ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div>
                        <h3 className="text-sm font-medium text-green-400">WhatsApp Connected</h3>
                        <p className="text-xs text-green-300/70">
                          Phone Number ID: {settings.phoneNumberId || oauthStatus?.whatsapp.phoneNumberId}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOAuthConnect('whatsapp')}
                        disabled={connectingChannel === 'whatsapp'}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Reconnect
                      </button>
                      <button
                        onClick={() => handleOAuthDisconnect('whatsapp')}
                        className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded-lg transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-amber-400">WhatsApp Not Connected</h3>
                        <p className="text-xs text-amber-300/70">Connect your WhatsApp Business account via Meta OAuth.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOAuthConnect('whatsapp')}
                      disabled={connectingChannel === 'whatsapp'}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-medium transition-colors"
                    >
                      {connectingChannel === 'whatsapp' ? (
                        <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting...</>
                      ) : (
                        <><Smartphone className="w-4 h-4" /> Connect WhatsApp</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Webhook setup guidance */}
              {oauthStatus?.whatsapp.connected && (
                <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-xl">
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Webhook Configuration</h3>
                  <p className="text-xs text-zinc-500 mb-3">
                    Enter these values in your Meta Developer App &rarr; WhatsApp &rarr; Configuration.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Callback URL</label>
                      <code className="block w-full truncate rounded-lg bg-zinc-950 px-3 py-2 text-xs text-emerald-300 select-all">
                        {oauthStatus?.whatsapp.webhookUrl || `${API_ORIGIN}/api/v1/webhooks/whatsapp`}
                      </code>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Verify Token</label>
                      <code className="block w-full truncate rounded-lg bg-zinc-950 px-3 py-2 text-xs text-emerald-300 select-all">
                        {oauthStatus?.whatsapp.webhookVerifyToken || '...'}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual credentials (advanced) */}
              <details className="bg-zinc-800/30 rounded-xl">
                <summary className="px-4 py-3 text-sm text-zinc-400 cursor-pointer hover:text-white transition-colors">
                  Advanced: Manual credential entry
                </summary>
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Phone Number ID</label>
                    <input
                      type="text"
                      value={settings.phoneNumberId}
                      onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                      placeholder="e.g., 1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">WhatsApp Business Account ID</label>
                    <input
                      type="text"
                      value={settings.businessAccountId}
                      onChange={(e) => setSettings({ ...settings, businessAccountId: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                      placeholder="e.g., 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Access Token</label>
                    <input
                      type="password"
                      value={settings.accessToken}
                      onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                      placeholder="Paste your Meta access token"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Manual Settings'}
                  </button>
                </div>
              </details>
            </div>
          )}

          {activeTab === 'instagram' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Instagram Configuration</h2>
              
              {/* Connection Status */}
              {settings.igUserId || oauthStatus?.instagram.connected ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div>
                        <h3 className="text-sm font-medium text-green-400">Instagram Connected</h3>
                        <p className="text-xs text-green-300/70">
                          Instagram User ID: {settings.igUserId || oauthStatus?.instagram.igUserId}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOAuthConnect('instagram')}
                        disabled={connectingChannel === 'instagram'}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Reconnect
                      </button>
                      <button
                        onClick={() => handleOAuthDisconnect('instagram')}
                        className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded-lg transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-amber-400">Instagram Not Connected</h3>
                        <p className="text-xs text-amber-300/70">Connect your Instagram Business account via Meta OAuth.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOAuthConnect('instagram')}
                      disabled={connectingChannel === 'instagram'}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm rounded-xl font-medium transition-colors"
                    >
                      {connectingChannel === 'instagram' ? (
                        <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting...</>
                      ) : (
                        <><Instagram className="w-4 h-4" /> Connect Instagram</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Webhook setup guidance */}
              {oauthStatus?.instagram.connected && (
                <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-xl">
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Webhook Configuration</h3>
                  <p className="text-xs text-zinc-500 mb-3">
                    Enter these values in your Meta Developer App &rarr; Instagram &rarr; Webhooks.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Callback URL</label>
                      <code className="block w-full truncate rounded-lg bg-zinc-950 px-3 py-2 text-xs text-pink-300 select-all">
                        {oauthStatus?.instagram.webhookUrl || `${window.location.origin}/webhook/instagram`}
                      </code>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Verify Token</label>
                      <code className="block w-full truncate rounded-lg bg-zinc-950 px-3 py-2 text-xs text-pink-300 select-all">
                        {oauthStatus?.instagram.webhookVerifyToken || '...'}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual credentials (advanced) */}
              <details className="bg-zinc-800/30 rounded-xl">
                <summary className="px-4 py-3 text-sm text-zinc-400 cursor-pointer hover:text-white transition-colors">
                  Advanced: Manual credential entry
                </summary>
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Instagram User ID</label>
                    <input
                      type="text"
                      value={settings.igUserId}
                      onChange={(e) => setSettings({ ...settings, igUserId: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                      placeholder="Your Instagram Business Account ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Access Token</label>
                    <input
                      type="password"
                      value={settings.igAccessToken}
                      onChange={(e) => setSettings({ ...settings, igAccessToken: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                      placeholder="Instagram Graph API Access Token"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Manual Settings'}
                  </button>
                </div>
              </details>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-white">Browser Notifications</div>
                    <div className="text-xs text-zinc-500">Get desktop notifications for new messages</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.browserNotifications}
                    onChange={(e) => setSettings({ ...settings, browserNotifications: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-white">Sound Notifications</div>
                    <div className="text-xs text-zinc-500">Play sound for new messages</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-white">Email Notifications</div>
                    <div className="text-xs text-zinc-500">Receive email summaries of activity</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'businessHours' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Business Hours</h2>
              <p className="text-sm text-zinc-400">Configure when agents are working and how to handle messages outside those hours.</p>

              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-white">Enable Business Hours</div>
                    <div className="text-xs text-zinc-500">Send away messages when outside working hours and no agents are online</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={businessHoursEnabled}
                    onChange={(e) => setBusinessHoursEnabled(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>

              {businessHoursEnabled && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-300">Working Hours</h3>
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                    const dayLabels: Record<string, string> = {
                      mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
                      thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
                    };
                    const isSet = !!businessHours[day];
                    return (
                      <div key={day} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-xl">
                        <label className="flex items-center gap-2 w-32 shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSet}
                            onChange={() => handleToggleDay(day)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm text-zinc-300 capitalize">{dayLabels[day]}</span>
                        </label>
                        {isSet && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={businessHours[day]?.[0] || '09:00'}
                              onChange={(e) => handleUpdateBusinessHour(day, 'start', e.target.value)}
                              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                            />
                            <span className="text-zinc-500">-</span>
                            <input
                              type="time"
                              value={businessHours[day]?.[1] || '18:00'}
                              onChange={(e) => handleUpdateBusinessHour(day, 'end', e.target.value)}
                              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={handleSaveBusinessHours}
                    className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100"
                  >
                    Save Business Hours
                  </button>
                </div>
              )}

              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Away Messages
                </h3>
                <p className="text-xs text-zinc-500">Messages sent when outside business hours. Higher priority messages are shown first.</p>

                <div className="p-4 bg-zinc-800/50 rounded-xl space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Message</label>
                    <textarea
                      value={newAwayMessage.message}
                      onChange={(e) => setNewAwayMessage({ ...newAwayMessage, message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none"
                      placeholder="We're currently away. We'll respond when we're back online."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Priority (higher = shown first)</label>
                      <input
                        type="number"
                        value={newAwayMessage.priority}
                        onChange={(e) => setNewAwayMessage({ ...newAwayMessage, priority: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none"
                        min={0}
                      />
                    </div>
                    <label className="flex items-center gap-2 p-4 bg-zinc-800/50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAwayMessage.showWhenNoAgent}
                        onChange={(e) => setNewAwayMessage({ ...newAwayMessage, showWhenNoAgent: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-zinc-300">Only when no agent online</span>
                    </label>
                  </div>
                  <button
                    onClick={handleCreateAwayMessage}
                    disabled={!newAwayMessage.message}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Away Message
                  </button>
                </div>

                <div className="space-y-2">
                  {awayMessages
                    .sort((a, b) => b.priority - a.priority)
                    .map((msg) => (
                      <div key={msg.id} className="flex items-start justify-between p-4 bg-zinc-800/30 border border-zinc-800 rounded-xl">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-zinc-400">Priority: {msg.priority}</span>
                            {msg.showWhenNoAgent && (
                              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">No Agent Only</span>
                            )}
                          </div>
                          <p className="text-sm text-white">{msg.message}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleAwayMessageActive(msg.id, msg.isActive)}
                            className={`px-3 py-1 text-xs rounded-lg ${
                              msg.isActive
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-zinc-700 text-zinc-400'
                            }`}
                          >
                            {msg.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleDeleteAwayMessage(msg.id)}
                            className="p-2 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  {awayMessages.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      No away messages configured
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'autoresponders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Auto-Responders</h2>
              </div>
              <p className="text-sm text-zinc-400">Automatically send messages based on triggers</p>

              <div className="p-4 bg-zinc-800/50 rounded-xl space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={newResponder.name}
                    onChange={(e) => setNewResponder({ ...newResponder, name: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none"
                    placeholder="Welcome Message"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Trigger</label>
                    <select
                      value={newResponder.trigger}
                      onChange={(e) => setNewResponder({ ...newResponder, trigger: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none"
                    >
                      <option value="keyword">Keyword</option>
                      <option value="new_contact">New Contact</option>
                      <option value="no_reply">No Reply (24h)</option>
                      <option value="away_message">Away Message</option>
                    </select>
                  </div>
                  {newResponder.trigger === 'keyword' && (
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Keyword</label>
                      <input
                        type="text"
                        value={newResponder.keyword}
                        onChange={(e) => setNewResponder({ ...newResponder, keyword: e.target.value })}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none"
                        placeholder="Hi"
                      />
                    </div>
                  )}
                  {newResponder.trigger === 'away_message' && (
                    <div className="col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                      <p className="text-xs text-amber-300">This trigger uses the highest priority active away message. Configure away messages in the Business Hours tab.</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Message</label>
                  <textarea
                    value={newResponder.message}
                    onChange={(e) => setNewResponder({ ...newResponder, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none"
                    placeholder="Hello! Thanks for messaging us..."
                  />
                </div>
                <button
                  onClick={handleCreateAutoresponder}
                  disabled={!newResponder.name || !newResponder.message}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Create Autoresponder
                </button>
              </div>

              <div className="space-y-2">
                {autoresponders.map((responder) => (
                  <div key={responder.id} className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-800 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{responder.name}</span>
                        {responder.isActive ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs rounded-full">Inactive</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Trigger: {responder.trigger} {responder.keyword && `- "${responder.keyword}"`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAutoresponder(responder.id)}
                      className="p-2 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {autoresponders.length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    No autoresponders configured
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'languages' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Language Settings</h2>
              <p className="text-sm text-zinc-400">Configure supported languages for AI responses and auto-detection</p>

              <div className="p-4 bg-zinc-800/50 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">Auto-detect Language</div>
                    <div className="text-xs text-zinc-500">Automatically detect customer's language using AI</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={languageSettings.autoDetect}
                    onChange={(e) => setLanguageSettings({ ...languageSettings, autoDetect: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Default Language</label>
                  <select
                    value={languageSettings.defaultLanguage}
                    onChange={(e) => setLanguageSettings({ ...languageSettings, defaultLanguage: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.name} ({lang.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Enabled Languages</h3>
                <p className="text-xs text-zinc-500 mb-4">Toggle languages that the AI can respond in. Disabled languages fallback to the default.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isEnabled = languageSettings.enabledLanguages.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguageSettings((prev) => ({
                            ...prev,
                            enabledLanguages: isEnabled
                              ? prev.enabledLanguages.filter((c) => c !== lang.code)
                              : [...prev.enabledLanguages, lang.code],
                          }));
                        }}
                        className={`p-3 rounded-xl text-sm transition-colors border ${
                          isEnabled
                            ? 'bg-zinc-700 border-zinc-600 text-white'
                            : 'bg-zinc-800/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        <div className="font-medium">{lang.name}</div>
                        <div className="text-xs text-zinc-500">{lang.code}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
