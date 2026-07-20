import axios, { AxiosError } from 'axios';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiProviderConfig {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AiResponse {
  content: string;
  provider: string;
  model: string;
  latencyMs: number;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface AiProviderAdapter {
  name: string;
  chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse>;
}

function openAiCompatibleAdapter(providerName: string, defaultBaseUrl: string) {
  return {
    name: providerName,
    async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
      const start = Date.now();
      const res = await axios.post(
        `${config.baseUrl || defaultBaseUrl}/chat/completions`,
        {
          model: config.model,
          messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30_000,
        }
      );
      const data = res.data;
      return {
        content: data.choices[0].message.content,
        provider: providerName,
        model: config.model,
        latencyMs: Date.now() - start,
        usage: data.usage
          ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens }
          : undefined,
      };
    },
  };
}

const geminiAdapter: AiProviderAdapter = {
  name: 'gemini',
  async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
    const start = Date.now();
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    const systemMsg = messages.find((m) => m.role === 'system');
    const payload: any = { contents };
    if (systemMsg) {
      payload.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      { ...payload, generationConfig: { maxOutputTokens: config.maxTokens, temperature: config.temperature } },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30_000 }
    );
    const data = res.data;
    return {
      content: data.candidates[0].content.parts[0].text,
      provider: 'gemini',
      model: config.model,
      latencyMs: Date.now() - start,
    };
  },
};

// ─── Cohere Adapter ───
const cohereAdapter: AiProviderAdapter = {
  name: 'cohere',
  async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
    const start = Date.now();
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'CHATBOT' : 'USER', message: m.content }));
    const res = await axios.post(
      `${config.baseUrl || 'https://api.cohere.com'}/v2/chat`,
      {
        model: config.model,
        messages: chatMessages,
        ...(systemMsg ? { preamble: systemMsg.content } : {}),
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      },
      {
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30_000,
      }
    );
    const data = res.data;
    return {
      content: data.message.content[0].text,
      provider: 'cohere',
      model: config.model,
      latencyMs: Date.now() - start,
    };
  },
};

const anthropicAdapter: AiProviderAdapter = {
  name: 'anthropic',
  async chat(messages: AiMessage[], config: AiProviderConfig): Promise<AiResponse> {
    const start = Date.now();
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));
    const res = await axios.post(
      `${config.baseUrl || 'https://api.anthropic.com/v1'}/messages`,
      {
        model: config.model || 'claude-3-5-sonnet-20241022',
        messages: chatMessages,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        max_tokens: config.maxTokens || 1024,
        temperature: config.temperature,
      },
      {
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 30_000,
      }
    );
    const data = res.data;
    return {
      content: data.content[0].text,
      provider: 'anthropic',
      model: config.model,
      latencyMs: Date.now() - start,
      usage: data.usage
        ? { promptTokens: data.usage.input_tokens, completionTokens: data.usage.output_tokens, totalTokens: data.usage.input_tokens + data.usage.output_tokens }
        : undefined,
    };
  },
};

export const providers: Record<string, AiProviderAdapter> = {
  openai: openAiCompatibleAdapter('openai', 'https://api.openai.com/v1'),
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  deepseek: openAiCompatibleAdapter('deepseek', 'https://api.deepseek.com'),
  openrouter: openAiCompatibleAdapter('openrouter', 'https://openrouter.ai/api/v1'),
  groq: openAiCompatibleAdapter('groq', 'https://api.groq.com/openai/v1'),
  cerebras: openAiCompatibleAdapter('cerebras', 'https://api.cerebras.ai/v1'),
  sambanova: openAiCompatibleAdapter('sambanova', 'https://api.sambanova.ai/v1'),
  together: openAiCompatibleAdapter('together', 'https://api.together.xyz/v1'),
  fireworks: openAiCompatibleAdapter('fireworks', 'https://api.fireworks.ai/inference/v1'),
  perplexity: openAiCompatibleAdapter('perplexity', 'https://api.perplexity.ai'),
  mistral: openAiCompatibleAdapter('mistral', 'https://api.mistral.ai/v1'),
  nvidia_nim: openAiCompatibleAdapter('nvidia_nim', 'https://integrate.api.nvidia.com/v1'),
  xai: openAiCompatibleAdapter('xai', 'https://api.x.ai/v1'),
  cohere: cohereAdapter,
  ollama: openAiCompatibleAdapter('ollama', 'http://localhost:11434/v1'),
  freellmapi: openAiCompatibleAdapter('freellmapi', 'http://127.0.0.1:31415/v1'),
  custom: openAiCompatibleAdapter('custom', ''),
};

// ─── Universal Provider Factory ───
// Any provider ID not explicitly registered above will automatically
// use the OpenAI-compatible adapter. This enables true BYOK (Bring Your Own Key)
// — users can add ANY OpenAI-compatible endpoint with any provider ID.
export function getProviderAdapter(providerId: string, baseUrl?: string): AiProviderAdapter | null {
  // First check if we have a built-in adapter
  if (providers[providerId]) {
    return providers[providerId];
  }

  // For any unknown provider, use the universal OpenAI-compatible adapter
  // The baseUrl from the DB config will be used when the adapter calls the API
  return openAiCompatibleAdapter(providerId, baseUrl || 'https://api.openai.com/v1');
}

export function isBuiltinProvider(providerId: string): boolean {
  return providerId in providers;
}

export function registerCustomProvider(providerId: string, defaultBaseUrl?: string): void {
  if (!providers[providerId]) {
    providers[providerId] = openAiCompatibleAdapter(providerId, defaultBaseUrl || '');
  }
}

export const LANGUAGE_DETECTION_PROMPT = 'Detect the language of this message. Respond with ONLY the ISO 639-1 language code (e.g., "en", "hi", "es", "pt"). Do NOT explain.';

export const FREE_MODELS: Record<string, { model: string; name: string }[]> = {
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

