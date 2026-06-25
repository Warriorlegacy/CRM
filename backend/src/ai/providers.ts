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
    { model: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free)' },
    { model: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct (Free)' },
    { model: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'Liquid LFM 2.5 1.2B Thinking (Free)' },
    { model: 'liquid/lfm-2.5-1.2b-instruct:free', name: 'Liquid LFM 2.5 1.2B Instruct (Free)' },
    { model: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B (Free)' },
    { model: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B (Free)' },
    { model: 'qwen/qwen3-coder:free', name: 'Qwen 3 Coder (Free)' },
    { model: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 Llama 3.1 405B (Free)' },
    { model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B (Free)' },
    { model: 'cohere/north-mini-code:free', name: 'Cohere North Mini Code (Free)' },
    { model: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
    { model: 'deepseek/deepseek-chat', name: 'DeepSeek V3' },
    { model: 'openai/gpt-4o', name: 'GPT-4o' },
    { model: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { model: 'openai/o1', name: 'OpenAI o1' },
    { model: 'openai/o1-mini', name: 'OpenAI o1 Mini' },
    { model: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { model: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
    { model: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
    { model: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
    { model: 'google/gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro' },
  ],
  groq: [
    { model: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
    { model: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill Qwen 32B' },
    { model: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Versatile)' },
    { model: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Instant)' },
    { model: 'gemma2-9b-it', name: 'Gemma 2 9B' },
    { model: 'mixtral-8x7b-instruct', name: 'Mixtral 8x7B' },
  ],
  cerebras: [
    { model: 'llama-3.3-70b', name: 'Llama 3.3 70B' },
    { model: 'llama-3.1-8b', name: 'Llama 3.1 8B' },
    { model: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
  ],
  mistral: [
    { model: 'mistral-large-latest', name: 'Mistral Large' },
    { model: 'mistral-medium-latest', name: 'Mistral Medium' },
    { model: 'mistral-small-latest', name: 'Mistral Small' },
    { model: 'open-mistral-nemo', name: 'Mistral Nemo (Free)' },
    { model: 'codestral-latest', name: 'Codestral (Coding)' },
  ],
  nvidia_nim: [
    { model: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
    { model: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct' },
    { model: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B Instruct' },
    { model: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B' },
    { model: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
    { model: 'google/gemma-2-27b-it', name: 'Gemma 2 27B' },
  ],
  cohere: [
    { model: 'command-r-plus', name: 'Command R+' },
    { model: 'command-r', name: 'Command R' },
    { model: 'command-light', name: 'Command Light' },
    { model: 'command-r-plus-08-2024', name: 'Command R+ (Aug 2024)' },
    { model: 'command-r-08-2024', name: 'Command R (Aug 2024)' },
  ],
  gemini: [
    { model: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { model: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash Lite' },
    { model: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro (Experimental)' },
    { model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  ],
  xai: [
    { model: 'grok-3', name: 'Grok 3' },
    { model: 'grok-3-mini', name: 'Grok 3 Mini' },
    { model: 'grok-2-1212', name: 'Grok 2' },
    { model: 'grok-2-mini', name: 'Grok 2 Mini' },
  ],
};
