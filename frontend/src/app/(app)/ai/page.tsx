'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Plus, Trash2, Zap, AlertTriangle, CheckCircle, XCircle, Loader2, TestTube, Brain, Sparkles } from 'lucide-react';

interface AiProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  priority: number;
  isActive: boolean;
  maxTokens: number;
  temperature: number;
  baseUrl?: string;
  lastUsedAt?: string;
  lastErrorAt?: string;
  errorCount: number;
  createdAt: string;
}

interface ProviderOption {
  id: string;
  name: string;
  models: { model: string; name: string }[];
}

interface AiStatus {
  totalProviders: number;
  activeProviders: number;
  recentAutoReplies: number;
  avgLatencyMs: number;
  recentLogs: {
    id: string;
    provider: string;
    model: string;
    latencyMs: number;
    wasSent: boolean;
    createdAt: string;
  }[];
}

const PROVIDER_ICONS: Record<string, string> = {
  freellmapi: '🔌',
  openrouter: '🌐',
  groq: '⚡',
  cerebras: '🧠',
  mistral: '🌬️',
  nvidia_nim: '💚',
  xai: '✖️',
  gemini: '✨',
  cohere: '🔷',
};

export default function AiSettingsPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [available, setAvailable] = useState<ProviderOption[]>([]);
  const [models, setModels] = useState<Record<string, { model: string; name: string }[]>>({});
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    apiKey: '',
    baseUrl: '',
    model: '',
    priority: 0,
    maxTokens: 1024,
    temperature: 0.7,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [provs, avail, st, modelsData] = await Promise.all([
        api.get<{ providers: AiProvider[] }>('/ai/providers'),
        api.get<{ providers: ProviderOption[] }>('/ai/providers/available'),
        api.get<AiStatus>('/ai/status'),
        api.get<{ models: Record<string, { model: string; name: string }[]> }>('/ai/providers/models'),
      ]);
      setProviders(provs.providers);
      setAvailable(avail.providers);
      setStatus(st);
      setModels(modelsData.models);
    } catch (err) {
      console.error('Failed to load AI settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    try {
      await api.post('/ai/providers', formData);
      setShowAdd(false);
      setFormData({ name: '', provider: '', apiKey: '', baseUrl: '', model: '', priority: 0, maxTokens: 1024, temperature: 0.7 });
      setIsCustomModel(false);
      loadData();
    } catch (err) {
      console.error('Failed to add provider:', err);
    }
  }

  async function handleTest(id: string) {
    setTesting(id);
    try {
      const res = await api.post<{ ok: boolean; response?: string; latencyMs?: number; provider?: string; model?: string; error?: string }>(`/ai/providers/${id}/test`, {});
      setTestResults((prev) => ({
        ...prev,
        [id]: { ok: res.ok, message: res.ok ? `✅ ${res.response} (${res.latencyMs}ms)` : `❌ ${res.error}` },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: { ok: false, message: `❌ ${err.response?.data?.error || err.message}` },
      }));
    } finally {
      setTesting(null);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await api.patch(`/ai/providers/${id}`, { isActive: !isActive });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this provider?')) return;
    await api.delete(`/ai/providers/${id}`);
    loadData();
  }

  async function handlePriorityChange(id: string, priority: number) {
    await api.patch(`/ai/providers/${id}`, { priority });
    loadData();
  }

  const selectedProvider = available.find((p) => p.id === formData.provider);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-purple-400" />
            AI Configuration
          </h1>
          <p className="text-zinc-400 mt-1">
            Multi-provider AI with automatic fallback. Add providers in priority order — the system tries each one until one works.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>

      {/* Status Cards */}
      {status && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Providers</div>
            <div className="text-2xl font-mono font-bold text-white">
              {status.activeProviders}<span className="text-zinc-600">/{status.totalProviders}</span>
            </div>
            <div className="text-xs text-zinc-500">active</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Auto-Replies</div>
            <div className="text-2xl font-mono font-bold text-emerald-400">{status.recentAutoReplies}</div>
            <div className="text-xs text-zinc-500">recent</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Avg Latency</div>
            <div className="text-2xl font-mono font-bold text-blue-400">{status.avgLatencyMs}ms</div>
            <div className="text-xs text-zinc-500">response time</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Fallback Chain</div>
            <div className="text-2xl font-mono font-bold text-amber-400">{status.totalProviders}</div>
            <div className="text-xs text-zinc-500">providers</div>
          </div>
        </div>
      )}

      {/* Fallback Chain Visualization */}
      {providers.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Fallback Chain (tries top → bottom)
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {providers.filter((p) => p.isActive).sort((a, b) => b.priority - a.priority).map((p, i, arr) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2">
                  <span className="text-lg">{PROVIDER_ICONS[p.provider] || '🤖'}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{p.name}</div>
                    <div className="text-xs text-zinc-500">{p.model}</div>
                  </div>
                  {testResults[p.id] && (
                    <span className={`text-xs ${testResults[p.id].ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {testResults[p.id].ok ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                {i < arr.length - 1 && (
                  <span className="text-zinc-600 text-lg">→</span>
                )}
              </div>
            ))}
            {providers.filter((p) => p.isActive).length === 0 && (
              <span className="text-zinc-500 text-sm">No active providers. Add one to enable AI features.</span>
            )}
          </div>
        </div>
      )}

      {/* Provider List */}
      <div className="space-y-3">
        {providers.map((prov) => (
          <div key={prov.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{PROVIDER_ICONS[prov.provider] || '🤖'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{prov.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{prov.provider}</span>
                    {!prov.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400">disabled</span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500 mt-0.5">
                    Model: <span className="font-mono text-zinc-300">{prov.model}</span>
                    <span className="mx-2">·</span>
                    Priority: <span className="font-mono text-zinc-300">{prov.priority}</span>
                    <span className="mx-2">·</span>
                    Max tokens: <span className="font-mono text-zinc-300">{prov.maxTokens}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTest(prov.id)}
                  disabled={testing === prov.id}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  title="Test connection"
                >
                  {testing === prov.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handlePriorityChange(prov.id, prov.priority + 1)}
                  className="px-2 py-1 rounded-lg hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors"
                  title="Increase priority"
                >
                  ↑ P{prov.priority}
                </button>
                <button
                  onClick={() => handleToggle(prov.id, prov.isActive)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    prov.isActive
                      ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                  }`}
                >
                  {prov.isActive ? 'Active' : 'Disabled'}
                </button>
                <button
                  onClick={() => handleDelete(prov.id)}
                  className="p-2 rounded-lg hover:bg-red-900/30 text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {testResults[prov.id] && (
              <div className={`mt-3 text-sm p-2 rounded-lg ${testResults[prov.id].ok ? 'bg-emerald-900/20 text-emerald-300' : 'bg-red-900/20 text-red-300'}`}>
                {testResults[prov.id].message}
              </div>
            )}
            {prov.lastErrorAt && prov.errorCount > 0 && (
              <div className="mt-2 text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {prov.errorCount} errors, last: {new Date(prov.lastErrorAt).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Provider Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Add AI Provider
            </h2>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => {
                  const provId = e.target.value;
                  const prov = available.find((p) => p.id === provId);
                  if (provId === 'freellmapi') {
                    setFormData({
                      ...formData,
                      provider: provId,
                      name: 'FreeLLMAPI',
                      apiKey: '',
                      baseUrl: 'http://127.0.0.1:31415/v1',
                      model: prov?.models[0]?.model || 'auto',
                    });
                    setIsCustomModel(false);
                  } else {
                    setFormData({
                      ...formData,
                      provider: provId,
                      name: prov?.name || '',
                      apiKey: '',
                      baseUrl: '',
                      model: prov?.models[0]?.model || '',
                    });
                    setIsCustomModel(false);
                  }
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="">Select provider...</option>
                {available
                  .filter((p) => p.id !== 'freellmapi' || user?.email === 'piyushrajsingh092@gmail.com')
                  .map((p) => (
                    <option key={p.id} value={p.id}>{PROVIDER_ICONS[p.id]} {p.name}</option>
                  ))}
              </select>
            </div>

            {selectedProvider && (
              <>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Name</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
                    placeholder="e.g. Groq Free"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">API Key</label>
                  <input
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm font-mono"
                    placeholder="Enter API key..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Base URL (Optional)</label>
                  <input
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm font-mono"
                    placeholder="e.g. https://api.openai.com/v1"
                  />
                  <div className="text-xs text-zinc-600 mt-1">Override default API endpoint if using custom or local proxies.</div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Model</label>
                  {!isCustomModel ? (
                    <div className="flex gap-2">
                      <select
                        value={formData.model}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsCustomModel(true);
                            setFormData({ ...formData, model: '' });
                          } else {
                            setFormData({ ...formData, model: e.target.value });
                          }
                        }}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
                      >
                        {selectedProvider.models.map((m) => (
                          <option key={m.model} value={m.model}>{m.name} ({m.model})</option>
                        ))}
                        <option value="custom">✏️ Custom Model...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm font-mono"
                        placeholder="e.g. meta-llama/llama-3.2-3b-instruct"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomModel(false);
                          setFormData({ ...formData, model: selectedProvider.models[0]?.model || '' });
                        }}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors"
                      >
                        Select List
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Priority</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
                    />
                    <div className="text-xs text-zinc-600 mt-1">Higher = tried first</div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Max Tokens</label>
                    <input
                      type="number"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 1024 })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0.7 })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowAdd(false); setIsCustomModel(false); }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!formData.provider || !formData.apiKey || !formData.model}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
              >
                Add Provider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {status && status.recentLogs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Recent AI Activity</h3>
          <div className="space-y-2">
            {status.recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">{PROVIDER_ICONS[log.provider] || '🤖'}</span>
                  <span className="text-zinc-300">{log.provider}/{log.model}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-zinc-500">{log.latencyMs}ms</span>
                  {log.wasSent ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-zinc-600" />
                  )}
                  <span className="text-xs text-zinc-600">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
