'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Smartphone, Instagram, Bot, Check, X, ArrowRight, Loader2,
  AlertTriangle, Plus, Trash2, TestTube, Zap, Brain, Key, ExternalLink,
  RefreshCw, Unplug
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, buildOAuthUrl, establishOAuthContext } from '@/lib/api';

interface ConnectionStatus {
  whatsapp: { connected: boolean; phoneNumberId: string | null; businessAccountId: string | null; connectedAt: string | null };
  instagram: { connected: boolean; igUserId: string | null; connectedAt: string | null };
}

interface AiProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  priority: number;
  isActive: boolean;
}

const PROVIDER_ICONS: Record<string, string> = {
  openai: '🟢', anthropic: '🟧', gemini: '✨', deepseek: '🐋',
  openrouter: '🌐', groq: '⚡', cerebras: '🧠', sambanova: '🚀',
  together: '🤝', fireworks: '🎆', perplexity: '🔍', mistral: '🌬️',
  nvidia_nim: '💚', xai: '✖️', cohere: '🔷', ollama: '🦙',
  freellmapi: '🔌', custom: '⚙️',
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI (GPT-4o/o1/o3)',
  anthropic: 'Anthropic (Claude 3.7/3.5)',
  gemini: 'Google Gemini (Free Tier)',
  deepseek: 'DeepSeek Official (V3/R1)',
  openrouter: 'OpenRouter (200+ Models)',
  groq: 'Groq (Ultra-Fast Free)',
  cerebras: 'Cerebras (Lightning Free)',
  sambanova: 'SambaNova (1000 tps Free)',
  together: 'Together AI',
  fireworks: 'Fireworks AI',
  perplexity: 'Perplexity AI (Web Search)',
  mistral: 'Mistral AI',
  nvidia_nim: 'NVIDIA NIM',
  xai: 'xAI (Grok)',
  cohere: 'Cohere Command',
  ollama: 'Ollama / Local LLM',
  freellmapi: 'FreeLLMAPI (Aggregator)',
  custom: 'Custom OpenAI-Compatible API',
};

const PROVIDER_DESCS: Record<string, string> = {
  openai: 'Official OpenAI API key. GPT-4o, GPT-4o-mini, o1, o3-mini.',
  anthropic: 'Official Anthropic API key. Claude 3.7 Sonnet, Claude 3.5 Sonnet & Haiku.',
  gemini: 'Google AI Studio API key. Generous free tier with Gemini 2.5 Flash & Pro.',
  deepseek: 'Official DeepSeek API key. Ultra cheap DeepSeek V3 & R1 reasoning.',
  openrouter: 'Access 200+ models with unified routing. Includes many completely free models.',
  groq: 'Ultra-fast inference on open-source Llama & DeepSeek models. Free tier available.',
  cerebras: 'World-fastest inference hardware for Llama 3.3. Free tier.',
  sambanova: 'Ultra high speed 1000 tokens/sec Llama & DeepSeek inference. Free tier.',
  together: 'Fast cloud inference for open-source Llama, DeepSeek & Qwen models.',
  fireworks: 'Production-ready fast inference for Llama 3.3 & DeepSeek R1.',
  perplexity: 'Web search grounded AI models (Sonar, Sonar Pro).',
  mistral: 'European AI leader. Free Open Mistral Nemo available.',
  nvidia_nim: 'NVIDIA AI Foundation Models. Free developer credits.',
  xai: 'xAI Grok models. High intelligence & fast response.',
  cohere: 'Enterprise-ready Cohere Command R & Command R+ models.',
  ollama: 'Local self-hosted LLM (Ollama, LM Studio, vLLM, LocalAI) at http://localhost:11434/v1.',
  freellmapi: 'Local unified router for API aggregation across keys.',
  custom: 'Connect ANY custom OpenAI-compatible endpoint (vLLM, FastChat, Anyscale, OpenWebUI, self-hosted).',
};

const PROVIDER_LINKS: Record<string, string> = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  gemini: 'https://aistudio.google.com/apikey',
  deepseek: 'https://platform.deepseek.com/api_keys',
  openrouter: 'https://openrouter.ai/keys',
  groq: 'https://console.groq.com/keys',
  cerebras: 'https://cloud.cerebras.ai/',
  sambanova: 'https://cloud.sambanova.ai/',
  together: 'https://api.together.ai/',
  fireworks: 'https://fireworks.ai/account/api-keys',
  perplexity: 'https://www.perplexity.ai/settings/api',
  mistral: 'https://console.mistral.ai/api-keys/',
  nvidia_nim: 'https://build.nvidia.com/',
  xai: 'https://console.x.ai/',
  cohere: 'https://dashboard.cohere.com/api-keys',
  ollama: 'https://ollama.com/',
  freellmapi: 'http://127.0.0.1:31415/',
  custom: '',
};

const FREE_MODELS: Record<string, { model: string; name: string }[]> = {
  openai: [
    { model: 'gpt-4o', name: 'GPT-4o (Flagship)' },
    { model: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)' },
    { model: 'o1', name: 'OpenAI o1 (Reasoning)' },
    { model: 'o1-mini', name: 'OpenAI o1 Mini' },
    { model: 'o3-mini', name: 'OpenAI o3 Mini' },
    { model: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { model: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { model: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)' },
    { model: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Best Code/Reasoning)' },
    { model: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Lightning Fast)' },
    { model: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  ],
  gemini: [
    { model: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Free Tier)' },
    { model: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { model: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { model: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash Lite' },
    { model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { model: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite (Preview)' },
  ],
  deepseek: [
    { model: 'deepseek-chat', name: 'DeepSeek V3 (Fast & Powerful)' },
    { model: 'deepseek-reasoner', name: 'DeepSeek R1 (Full Reasoning)' },
  ],
  openrouter: [
    { model: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free)' },
    { model: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct (Free)' },
    { model: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)' },
    { model: 'deepseek/deepseek-chat:free', name: 'DeepSeek V3 (Free)' },
    { model: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
    { model: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B (Free)' },
    { model: 'qwen/qwen3-coder:free', name: 'Qwen 3 Coder (Free)' },
    { model: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B (Free)' },
    { model: 'openai/gpt-4o', name: 'GPT-4o' },
    { model: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { model: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { model: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
  ],
  groq: [
    { model: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B (Free)' },
    { model: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Free)' },
    { model: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Free)' },
    { model: 'gemma2-9b-it', name: 'Gemma 2 9B (Free)' },
    { model: 'mixtral-8x7b-instruct', name: 'Mixtral 8x7B (Free)' },
  ],
  cerebras: [
    { model: 'llama-3.3-70b', name: 'Llama 3.3 70B (Ultra Fast Free)' },
    { model: 'llama-3.1-8b', name: 'Llama 3.1 8B (Ultra Fast Free)' },
    { model: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B' },
  ],
  sambanova: [
    { model: 'Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B (Free 1000tps)' },
    { model: 'DeepSeek-R1', name: 'DeepSeek R1 (Free 1000tps)' },
    { model: 'Meta-Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B (Free 1000tps)' },
    { model: 'Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B' },
  ],
  together: [
    { model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo' },
    { model: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
    { model: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
    { model: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B' },
  ],
  fireworks: [
    { model: 'accounts/fireworks/models/deepseek-r1', name: 'DeepSeek R1 (Fireworks)' },
    { model: 'accounts/fireworks/models/deepseek-v3', name: 'DeepSeek V3 (Fireworks)' },
    { model: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B' },
  ],
  perplexity: [
    { model: 'sonar-pro', name: 'Perplexity Sonar Pro (Search & Reasoning)' },
    { model: 'sonar', name: 'Perplexity Sonar (Fast Web Search)' },
    { model: 'sonar-reasoning', name: 'Perplexity Sonar Reasoning' },
  ],
  mistral: [
    { model: 'open-mistral-nemo', name: 'Mistral Nemo (Free)' },
    { model: 'mistral-large-latest', name: 'Mistral Large' },
    { model: 'mistral-small-latest', name: 'Mistral Small' },
    { model: 'codestral-latest', name: 'Codestral (Coding)' },
  ],
  nvidia_nim: [
    { model: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
    { model: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
    { model: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B' },
  ],
  cohere: [
    { model: 'command-r-plus', name: 'Command R+' },
    { model: 'command-r', name: 'Command R' },
  ],
  xai: [
    { model: 'grok-3', name: 'Grok 3' },
    { model: 'grok-3-mini', name: 'Grok 3 Mini' },
    { model: 'grok-2-1212', name: 'Grok 2' },
  ],
  ollama: [
    { model: 'llama3.3', name: 'Llama 3.3 (Local Ollama)' },
    { model: 'deepseek-r1', name: 'DeepSeek R1 (Local Ollama)' },
    { model: 'mistral', name: 'Mistral (Local Ollama)' },
    { model: 'qwen2.5', name: 'Qwen 2.5 (Local Ollama)' },
    { model: 'custom', name: 'Custom Local Model Name' },
  ],
  freellmapi: [
    { model: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)' },
    { model: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'Liquid LFM 2.5 1.2B Thinking (Free)' },
    { model: 'auto', name: 'Auto Routing' },
  ],
  custom: [
    { model: 'custom-model', name: 'Custom Model ID (Specify below)' },
  ],
};


export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { workspace, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<ConnectionStatus>({
    whatsapp: { connected: false, phoneNumberId: null, businessAccountId: null, connectedAt: null },
    instagram: { connected: false, igUserId: null, connectedAt: null },
  });
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [newProvider, setNewProvider] = useState({ provider: '', apiKey: '', model: '', name: '', baseUrl: '' });
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);

  useEffect(() => {
    const returnedToken = searchParams.get('token');
    if (returnedToken) {
      localStorage.setItem('auth_token', returnedToken);
    }

    const waStatus = searchParams.get('whatsapp');
    const igStatus = searchParams.get('instagram');
    const reason = searchParams.get('reason');

    if (waStatus === 'connected') {
      setMessage({ type: 'success', text: 'WhatsApp connected successfully!' });
      loadConnections();
    } else if (waStatus === 'error') {
      const errorMsg = reason === 'no_accounts'
        ? 'No WhatsApp Business Account found. Please ensure your Meta account has a WhatsApp Business Account set up in Meta Business Suite.'
        : 'WhatsApp connection failed: ' + (reason || 'unknown error');
      setMessage({ type: 'error', text: errorMsg });
    }

    if (igStatus === 'connected') {
      setMessage({ type: 'success', text: 'Instagram connected successfully!' });
      loadConnections();
    } else if (igStatus === 'error') {
      setMessage({ type: 'error', text: 'Instagram connection failed: ' + (reason || 'unknown error') });
    }

    if (waStatus || igStatus) {
      router.replace('/setup');
    }
  }, [searchParams, router]);

  const loadConnections = useCallback(async () => {
    try {
      const [connStatus, provs] = await Promise.all([
        api.get<ConnectionStatus>('/oauth/status').catch(() => ({
          whatsapp: { connected: false, phoneNumberId: null, businessAccountId: null, connectedAt: null },
          instagram: { connected: false, igUserId: null, connectedAt: null },
        })),
        api.get<{ providers: AiProvider[] }>('/ai/providers').catch(() => ({ providers: [] })),
      ]);
      setConnections(connStatus);
      setProviders(provs.providers || []);
    } catch (err) {
      console.error('Failed to load setup data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleConnectWhatsApp = async () => {
    setConnectingChannel('whatsapp');
    try {
      await establishOAuthContext('whatsapp');
      window.location.href = buildOAuthUrl('whatsapp');
    } catch {
      setConnectingChannel(null);
      setMessage({
        type: 'error',
        text: 'Unable to initialize Meta 1-Click authorization. Please ensure META_APP_ID is configured in backend environment variables.',
      });
    }
  };

  const handleConnectInstagram = async () => {
    setConnectingChannel('instagram');
    try {
      await establishOAuthContext('instagram');
      window.location.href = buildOAuthUrl('instagram');
    } catch {
      setConnectingChannel(null);
    }
  };

  const handleDisconnect = async (channel: string) => {
    if (!confirm('Disconnect ' + channel + '? You will need to reconnect to receive messages.')) return;
    await api.delete('/oauth/disconnect/' + channel);
    loadConnections();
  };

  const handleAddProvider = async () => {
    if (!newProvider.provider || !newProvider.model) return;
    try {
      await api.post('/ai/providers', {
        name: newProvider.name || PROVIDER_LABELS[newProvider.provider],
        provider: newProvider.provider,
        apiKey: newProvider.apiKey || 'sk-local-placeholder',
        model: newProvider.model,
        baseUrl: newProvider.baseUrl || undefined,
        priority: providers.length,
        maxTokens: 1024,
        temperature: 0.7,
      });
      setShowAddProvider(false);
      setNewProvider({ provider: '', apiKey: '', model: '', name: '', baseUrl: '' });
      setIsCustomModel(false);
      loadConnections();
    } catch {
      setMessage({ type: 'error', text: 'Failed to add provider' });
    }
  };

  const handleTestProvider = async (id: string) => {
    setTesting(id);
    try {
      const res = await api.post<{ ok: boolean; response?: string; latencyMs?: number; error?: string }>(
        '/ai/providers/' + id + '/test', {}
      );
      setTestResults(prev => ({
        ...prev,
        [id]: { ok: res.ok, message: res.ok ? 'Connected (' + res.latencyMs + 'ms)' : (res.error || 'Failed') },
      }));
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [id]: { ok: false, message: err.message },
      }));
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Remove this AI provider?')) return;
    await api.delete('/ai/providers/' + id);
    loadConnections();
  };

  const handleDeployWelcomeBot = async () => {
    try {
      await api.post('/automation/templates/welcome-bot/use', {});
      setMessage({ type: 'success', text: 'Welcome Bot deployed! It will auto-reply to new contacts.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to deploy Welcome Bot' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const selectedProviderModels = newProvider.provider ? FREE_MODELS[newProvider.provider] || [] : [];
  const hasAtLeastOneChannel = connections.whatsapp.connected || connections.instagram.connected;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Setup Your Workspace</h1>
        <p className="text-zinc-400 text-lg">
          Connect your channels, add your AI keys, and let the app handle the rest.
        </p>
      </div>

      {message && (
        <div className={'flex items-center gap-3 p-4 rounded-xl ' + (
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        )}>
          {message.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
          <p className="text-sm">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* STEP 1: Connect Channels */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">1</div>
          <div>
            <h2 className="text-xl font-bold text-white">Connect WhatsApp & Instagram (1-Click Zero Config)</h2>
            <p className="text-emerald-400/90 text-sm font-medium">✨ No manual webhook or Meta app setup required. Just click connect to authorize.</p>
          </div>
        </div>
        <div className="ml-11 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-300">
          <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
          <span><strong>Zero Setup Needed:</strong> Signing in with your Meta account automatically connects your Phone Numbers, Instagram Accounts, and Webhooks in seconds.</span>
        </div>

        <div className="grid grid-cols-2 gap-4 ml-11">
          {/* WhatsApp Card */}
          <div className={'rounded-2xl border p-6 transition-all ' + (
            connections.whatsapp.connected
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">WhatsApp Business</h3>
                <p className="text-xs text-zinc-500">Receive and reply to messages</p>
              </div>
            </div>

            {connections.whatsapp.connected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <Check className="w-4 h-4" />
                  Connected
                  <span className="text-xs text-zinc-500 ml-1">
                    ID: {(connections.whatsapp.phoneNumberId || '').slice(0, 10)}...
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConnectWhatsApp}
                    disabled={connectingChannel === 'whatsapp'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reconnect
                  </button>
                  <button
                    onClick={() => handleDisconnect('whatsapp')}
                    className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-xl transition-colors"
                  >
                    <Unplug className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Click below to sign in with your WhatsApp Business account via Meta.
                </p>
                <button
                  onClick={handleConnectWhatsApp}
                  disabled={connectingChannel === 'whatsapp'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  {connectingChannel === 'whatsapp' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                  {connectingChannel === 'whatsapp' ? 'Connecting...' : 'Connect WhatsApp'}
                </button>
                <p className="text-xs text-zinc-600 text-center">
                  You will be redirected to Meta to authorize
                </p>
              </div>
            )}
          </div>

          {/* Instagram Card */}
          <div className={'rounded-2xl border p-6 transition-all ' + (
            connections.instagram.connected
              ? 'bg-pink-500/5 border-pink-500/20'
              : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Instagram className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Instagram Business</h3>
                <p className="text-xs text-zinc-500">Manage DMs in one place</p>
              </div>
            </div>

            {connections.instagram.connected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-pink-400">
                  <Check className="w-4 h-4" />
                  Connected
                  <span className="text-xs text-zinc-500 ml-1">
                    ID: {(connections.instagram.igUserId || '').slice(0, 10)}...
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConnectInstagram}
                    disabled={connectingChannel === 'instagram'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reconnect
                  </button>
                  <button
                    onClick={() => handleDisconnect('instagram')}
                    className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-xl transition-colors"
                  >
                    <Unplug className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Connect your Instagram Business account to manage DMs alongside WhatsApp.
                </p>
                <button
                  onClick={handleConnectInstagram}
                  disabled={connectingChannel === 'instagram'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  {connectingChannel === 'instagram' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Instagram className="w-4 h-4" />
                  )}
                  {connectingChannel === 'instagram' ? 'Connecting...' : 'Connect Instagram'}
                </button>
                <p className="text-xs text-zinc-600 text-center">
                  Requires Instagram Business + Facebook Page
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STEP 2: Add AI Providers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Your AI Keys</h2>
              <p className="text-zinc-500 text-sm">Use your own API keys from different AI providers. The system auto-falls back if one fails.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddProvider(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Provider
          </button>
        </div>

        {providers.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 ml-11">
            {providers.map(p => (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{PROVIDER_ICONS[p.provider] || '🤖'}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{p.name}</div>
                      <div className="text-xs text-zinc-500 font-mono">{p.model}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {testResults[p.id] && (
                      <span className={'text-xs px-2 py-0.5 rounded-full ' + (
                        testResults[p.id].ok ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
                      )}>
                        {testResults[p.id].ok ? 'OK' : 'Fail'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestProvider(p.id)}
                    disabled={testing === p.id}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg transition-colors"
                  >
                    {testing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube className="w-3 h-3" />}
                    Test
                  </button>
                  <button
                    onClick={() => handleDeleteProvider(p.id)}
                    className="px-2 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ml-11 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center">
            <Key className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No AI providers configured yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Add at least one provider to enable auto-replies and smart routing.</p>
            <button
              onClick={() => setShowAddProvider(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Your First Provider
            </button>
          </div>
        )}
      </div>

      {/* STEP 3: Deploy Automation */}
      {hasAtLeastOneChannel && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <h2 className="text-xl font-bold text-white">Deploy Automation</h2>
              <p className="text-zinc-500 text-sm">One-click chatbot templates to get started instantly.</p>
            </div>
          </div>

          <div className="ml-11 grid grid-cols-3 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
              <Bot className="w-6 h-6 text-blue-400 mb-2" />
              <h3 className="text-sm font-medium text-white">Welcome Bot</h3>
              <p className="text-xs text-zinc-500 mt-1">Auto-greets new contacts and routes them</p>
              <button
                onClick={handleDeployWelcomeBot}
                className="mt-3 w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
              >
                Deploy Now
              </button>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
              <Zap className="w-6 h-6 text-amber-400 mb-2" />
              <h3 className="text-sm font-medium text-white">Support Triage</h3>
              <p className="text-xs text-zinc-500 mt-1">Auto-categorizes and routes support tickets</p>
              <button
                onClick={() => router.push('/automation')}
                className="mt-3 w-full px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
              >
                View in Automation
              </button>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
              <Brain className="w-6 h-6 text-purple-400 mb-2" />
              <h3 className="text-sm font-medium text-white">Sales Qualifier</h3>
              <p className="text-xs text-zinc-500 mt-1">Qualifies leads with smart questions</p>
              <button
                onClick={() => router.push('/automation')}
                className="mt-3 w-full px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
              >
                View in Automation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center pt-4">
        <button
          onClick={() => router.push('/inbox')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
        >
          Go to Inbox <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Add Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              Add AI Provider
            </h2>
            <p className="text-sm text-zinc-400">
              Enter your own API key. Your keys are encrypted and stored per-workspace.
            </p>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Provider</label>
              <select
                value={newProvider.provider}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'freellmapi') {
                    setNewProvider({
                      ...newProvider,
                      provider: val,
                      name: 'FreeLLMAPI',
                      apiKey: '',
                      baseUrl: 'http://127.0.0.1:31415/v1',
                      model: FREE_MODELS[val]?.[0]?.model || 'auto',
                    });
                    setIsCustomModel(false);
                  } else {
                    setNewProvider({
                      ...newProvider,
                      provider: val,
                      name: PROVIDER_LABELS[val] || '',
                      apiKey: '',
                      baseUrl: '',
                      model: FREE_MODELS[val]?.[0]?.model || '',
                    });
                    setIsCustomModel(false);
                  }
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
              >
                  <option value="">Select provider...</option>
                  {Object.entries(PROVIDER_LABELS).map(([id, name]) => (
                    <option key={id} value={id}>{PROVIDER_ICONS[id]} {name}</option>
                  ))}
              </select>
            </div>

            {newProvider.provider && (
              <div className="bg-zinc-800/50 rounded-xl p-3 text-xs text-zinc-400">
                <p>{PROVIDER_DESCS[newProvider.provider]}</p>
                <a
                  href={PROVIDER_LINKS[newProvider.provider]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 mt-1"
                >
                  Get API key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {newProvider.provider && (
              <>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">API Key</label>
                  <input
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm font-mono"
                    placeholder="Enter your API key..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Base URL (Optional)</label>
                  <input
                    value={newProvider.baseUrl}
                    onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
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
                        value={newProvider.model}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsCustomModel(true);
                            setNewProvider({ ...newProvider, model: '' });
                          } else {
                            setNewProvider({ ...newProvider, model: e.target.value });
                          }
                        }}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
                      >
                        {selectedProviderModels.map((m) => (
                          <option key={m.model} value={m.model}>{m.name} ({m.model})</option>
                        ))}
                        <option value="custom">✏️ Custom Model...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={newProvider.model}
                        onChange={(e) => setNewProvider({ ...newProvider, model: e.target.value })}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm font-mono"
                        placeholder="e.g. meta-llama/llama-3.2-3b-instruct"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomModel(false);
                          setNewProvider({ ...newProvider, model: selectedProviderModels[0]?.model || '' });
                        }}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors"
                      >
                        Select List
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowAddProvider(false); setNewProvider({ provider: '', apiKey: '', model: '', name: '', baseUrl: '' }); setIsCustomModel(false); }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProvider}
                disabled={!newProvider.provider || !newProvider.model}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
              >
                Add Provider
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

