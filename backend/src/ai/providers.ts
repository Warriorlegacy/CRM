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

export const providers: Record<string, AiProviderAdapter> = {
  freellmapi: openAiCompatibleAdapter('freellmapi', 'http://127.0.0.1:31415/v1'),
  openrouter: openAiCompatibleAdapter('openrouter', 'https://openrouter.ai/api/v1'),
  groq: openAiCompatibleAdapter('groq', 'https://api.groq.com/openai/v1'),
  cerebras: openAiCompatibleAdapter('cerebras', 'https://api.cerebras.ai/v1'),
  mistral: openAiCompatibleAdapter('mistral', 'https://api.mistral.ai/v1'),
  nvidia_nim: openAiCompatibleAdapter('nvidia_nim', 'https://integrate.api.nvidia.com/v1'),
  xai: openAiCompatibleAdapter('xai', 'https://api.x.ai/v1'),
  gemini: geminiAdapter,
  cohere: cohereAdapter,
};

export const FREE_MODELS: Record<string, { model: string; name: string }[]> = {
  freellmapi: [
    { model: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)' },
    { model: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'Liquid LFM 2.5 1.2B Thinking (Free)' },
    { model: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)' },
    { model: 'auto', name: 'Auto Routing' },
  ],
  openrouter: [
    { model: 'meta-llama/llama-4-scout:free', name: 'Llama 4 Scout (Free)' },
    { model: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B (Free)' },
    { model: 'mistralai/mistral-small-3.2-24b-instruct:free', name: 'Mistral Small 3.2 (Free)' },
    { model: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3 (Free)' },
  ],
  groq: [
    { model: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { model: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
    { model: 'gemma2-9b-it', name: 'Gemma 2 9B' },
  ],
  cerebras: [
    { model: 'llama-3.3-70b', name: 'Llama 3.3 70B' },
    { model: 'llama-3.1-8b', name: 'Llama 3.1 8B' },
  ],
  mistral: [
    { model: 'mistral-small-latest', name: 'Mistral Small' },
    { model: 'open-mistral-nemo', name: 'Mistral Nemo (Free)' },
  ],
  nvidia_nim: [
    { model: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
    { model: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
    { model: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B' },
  ],
  cohere: [
    { model: 'command-r', name: 'Command R' },
    { model: 'command-light', name: 'Command Light (Fast)' },
  ],
  gemini: [
    { model: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  ],
  xai: [
    { model: 'grok-3-mini', name: 'Grok 3 Mini' },
  ],
};
