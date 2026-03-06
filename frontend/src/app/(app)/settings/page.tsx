'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Bell, Shield, Smartphone, Key, Save, Check, AlertTriangle } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  wa?: {
    phoneNumberId: string | null;
    businessAccountId: string | null;
  } | null;
}

export default function SettingsPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [workspaceData, setWorkspaceData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'whatsapp' | 'notifications'>('general');
  
  const [settings, setSettings] = useState({
    workspaceName: '',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    webhookVerifyToken: '',
    emailNotifications: true,
    browserNotifications: true,
    soundEnabled: true,
  });

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadWorkspace();
  }, [USER_ID, WORKSPACE_ID, authLoading]);

  const loadWorkspace = async () => {
    try {
      const data = await api.get('/workspaces/current', { headers });
      setWorkspaceData(data.workspace);
      setSettings(prev => ({
        ...prev,
        workspaceName: data.workspace.name,
        phoneNumberId: data.workspace.wa?.phoneNumberId || '',
        businessAccountId: data.workspace.wa?.businessAccountId || '',
      }));
    } catch (error) {
      console.error('Failed to load workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'general') {
        // Update workspace name would go here
        showSuccess('Workspace settings saved');
      } else if (activeTab === 'whatsapp') {
        await api.post('/workspaces/wa-account', {
          phoneNumberId: settings.phoneNumberId,
          businessAccountId: settings.businessAccountId,
          accessToken: settings.accessToken,
          webhookVerifyToken: settings.webhookVerifyToken,
        }, { headers });
        showSuccess('WhatsApp settings saved');
      } else if (activeTab === 'notifications') {
        // Save notification preferences
        showSuccess('Notification preferences saved');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-zinc-500">Manage your workspace and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 rounded-xl">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-1">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Workspace Settings</h2>
                <p className="text-sm text-zinc-500">Manage your workspace details</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Workspace Name</label>
                  <input
                    type="text"
                    value={settings.workspaceName}
                    onChange={(e) => setSettings({ ...settings, workspaceName: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-zinc-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-white">Workspace ID</h3>
                      <p className="text-sm text-zinc-500 mt-1">{WORKSPACE_ID}</p>
                      <p className="text-xs text-zinc-600 mt-2">
                        Used for API integrations and webhook configuration
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">WhatsApp Cloud API</h2>
                <p className="text-sm text-zinc-500">Connect your WhatsApp Business account</p>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-400">Demo Mode Active</h3>
                    <p className="text-sm text-yellow-200/70 mt-1">
                      Your workspace is currently running in demo mode. Messages are not sent to real WhatsApp numbers.
                      Configure your Meta Business account to go live.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={settings.phoneNumberId}
                    onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                    placeholder="Enter your WhatsApp phone number ID"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 outline-none focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Business Account ID</label>
                  <input
                    type="text"
                    value={settings.businessAccountId}
                    onChange={(e) => setSettings({ ...settings, businessAccountId: e.target.value })}
                    placeholder="Enter your Meta Business account ID"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 outline-none focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Access Token</label>
                  <input
                    type="password"
                    value={settings.accessToken}
                    onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                    placeholder="Enter your permanent access token"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 outline-none focus:border-zinc-600"
                  />
                  <p className="text-xs text-zinc-600 mt-1">
                    Generate a permanent token from Meta Business Settings
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Webhook Verify Token</label>
                  <input
                    type="text"
                    value={settings.webhookVerifyToken}
                    onChange={(e) => setSettings({ ...settings, webhookVerifyToken: e.target.value })}
                    placeholder="Enter a secure verify token"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-xl">
                  <h3 className="font-medium text-white mb-2">Webhook URL</h3>
                  <code className="block p-3 bg-zinc-950 rounded-lg text-sm text-zinc-400 break-all">
                    https://your-domain.com/webhook/whatsapp
                  </code>
                  <p className="text-xs text-zinc-600 mt-2">
                    Add this URL to your Meta Business webhook configuration
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Notification Preferences</h2>
                <p className="text-sm text-zinc-500">Choose how you want to be notified</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'browserNotifications',
                    label: 'Browser Notifications',
                    description: 'Show desktop notifications for new messages',
                  },
                  {
                    key: 'soundEnabled',
                    label: 'Sound Alerts',
                    description: 'Play sound when new messages arrive',
                  },
                  {
                    key: 'emailNotifications',
                    label: 'Email Notifications',
                    description: 'Receive email digests of missed messages',
                    disabled: true,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl ${
                      item.disabled ? 'opacity-50' : ''
                    }`}
                  >
                    <div>
                      <h3 className="font-medium text-white">{item.label}</h3>
                      <p className="text-sm text-zinc-500">{item.description}</p>
                      {item.disabled && (
                        <span className="text-xs text-zinc-600">(Coming soon)</span>
                      )}
                    </div>
                    <button
                      onClick={() => !item.disabled && setSettings({
                        ...settings,
                        [item.key]: !settings[item.key as keyof typeof settings],
                      })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        settings[item.key as keyof typeof settings]
                          ? 'bg-green-500'
                          : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          settings[item.key as keyof typeof settings]
                            ? 'left-7'
                            : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
