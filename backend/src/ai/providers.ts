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

export const LANGUAGE_DETECTION_PROMPT = 'Detect the language of this message. Respond with ONLY the ISO 639-1 language code (e.g., "en", "hi", "es", "pt"). Do NOT explain.';

export const FREE_MODELS: Record<string, { model: string; name: string }[]> = {
  freellmapi: [
    { model: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)' },
    { model: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'Liquid LFM 2.5 1.2B Thinking (Free)' },
    { model: 'liquid/lfm-2.5-1.2b-instruct:free', name: 'Liquid LFM 2.5 1.2B (Free)' },
    { model: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)' },
    { model: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)' },
    { model: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (OpenRouter Free)' },
    { model: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B (Free)' },
    { model: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B (Free)' },
    { model: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B (Free)' },
    { model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B (Free)' },
    { model: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B (Free)' },
    { model: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' },
    { model: 'openai/gpt-oss-safeguard-20b', name: 'GPT-OSS Safeguard 20B' },
    { model: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash-Lite Preview' },
    { model: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { model: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
    { model: 'gemma-4-31b-it', name: 'Gemma 4 31B' },
    { model: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B' },
    { model: 'ministral-8b-latest', name: 'Ministral 8B' },
    { model: 'mistral-large-latest', name: 'Mistral Large' },
    { model: 'mistral-medium-latest', name: 'Mistral Medium' },
    { model: 'mistral-small-latest', name: 'Mistral Small' },
    { model: 'codestral-latest', name: 'Codestral (Coding)' },
    { model: 'command-r-08-2024', name: 'Command R' },
    { model: 'command-r-plus-08-2024', name: 'Command R+' },
    { model: 'command-a-03-2025', name: 'Command A' },
    { model: 'command-a-reasoning-08-2025', name: 'Command A Reasoning' },
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
    { model: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)' },
    { model: 'deepseek/deepseek-chat:free', name: 'DeepSeek V3 (Free)' },
    { model: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
    { model: 'google/gemini-2.0-flash-thinking-exp:free', name: 'Gemini 2.0 Flash Thinking (Free)' },
    { model: 'microsoft/phi-3-medium-128k-instruct:free', name: 'Phi 3 Medium 128k (Free)' },
    { model: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)' },
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
    { model: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { model: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { model: 'google/gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite (Preview)' },
    { model: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
  ],
  groq: [
    { model: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
    { model: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill Qwen 32B' },
    { model: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Versatile)' },
    { model: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Instant)' },
    { model: 'llama-3.2-1b-preview', name: 'Llama 3.2 1B (Preview)' },
    { model: 'llama-3.2-3b-preview', name: 'Llama 3.2 3B (Preview)' },
    { model: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision (Preview)' },
    { model: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B Vision (Preview)' },
    { model: 'llama-guard-3-8b', name: 'Llama Guard 3 8B' },
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
    { model: 'ministral-3b-latest', name: 'Ministral 3B' },
    { model: 'ministral-8b-latest', name: 'Ministral 8B' },
    { model: 'pixtral-12b-latest', name: 'Pixtral 12B' },
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
    { model: 'command-a-03-2025', name: 'Command A' },
    { model: 'command-a-reasoning-08-2025', name: 'Command A Reasoning' },
  ],
  gemini: [
    { model: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { model: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash Lite' },
    { model: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro (Experimental)' },
    { model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { model: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { model: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { model: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite (Preview)' },
  ],
  xai: [
    { model: 'grok-3', name: 'Grok 3' },
    { model: 'grok-3-mini', name: 'Grok 3 Mini' },
    { model: 'grok-2-1212', name: 'Grok 2' },
    { model: 'grok-2-mini', name: 'Grok 2 Mini' },
  ],
};
