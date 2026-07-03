'use client';

import { useState, useEffect } from 'react';
import { api, buildOAuthUrl, establishOAuthContext } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Settings, Bell, Smartphone, Check, AlertTriangle, Bot, Trash2, Plus, Instagram,
  RefreshCw, Loader2
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
  const [activeTab, setActiveTab] = useState<'general' | 'whatsapp' | 'instagram' | 'notifications' | 'autoresponders'>('general');
  const [autoresponders, setAutoresponders] = useState<Autoresponder[]>([]);
  const [oauthStatus, setOauthStatus] = useState<{
    whatsapp: { connected: boolean; phoneNumberId: string | null };
    instagram: { connected: boolean; igUserId: string | null };
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

  const [newResponder, setNewResponder] = useState({
    name: '',
    trigger: 'keyword',
    keyword: '',
    delayMinutes: 0,
    message: '',
    isActive: true,
  });

  useEffect(() => {
    if (authLoading) return;
    loadWorkspace();
    loadAutoresponders();
    loadOauthStatus();
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
        whatsapp: { connected: boolean; phoneNumberId: string | null };
        instagram: { connected: boolean; igUserId: string | null };
      }>('/oauth/status');
      setOauthStatus(status);
    } catch (error) {
      console.error('Failed to load OAuth status:', error);
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
      } else if (activeTab === 'instagram') {
        await api.post('/workspaces/ig-account', {
          igUserId: settings.igUserId,
          accessToken: settings.igAccessToken,
          webhookVerifyToken: settings.igWebhookVerifyToken,
        });
        showSuccess('Instagram settings saved');
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
    { id: 'autoresponders', label: 'Auto-Responders', icon: Bot },
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
                onClick={() => setActiveTab(tab.id as 'general' | 'whatsapp' | 'instagram' | 'notifications' | 'autoresponders')}
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
        </div>
      </div>
    </div>
  );
}
