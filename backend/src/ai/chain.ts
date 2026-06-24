import { prisma } from '../prisma';
import { providers, AiMessage, AiResponse, AiProviderConfig } from './providers';

export interface FallbackResult extends AiResponse {
  attempts: { provider: string; model: string; error: string; latencyMs: number }[];
}

const PROVIDER_BASE_URLS: Record<string, string> = {
  freellmapi: 'http://127.0.0.1:31415/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  cerebras: 'https://api.cerebras.ai/v1',
  mistral: 'https://api.mistral.ai/v1',
  nvidia_nim: 'https://integrate.api.nvidia.com/v1',
  xai: 'https://api.x.ai/v1',
  gemini: 'https://generativelanguage.googleapis.com',
  cohere: 'https://api.cohere.com',
};

// Sliding window rate limiter configuration (15 requests per minute per provider/workspace)
const rateLimitCache = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;

function checkAndIncrementRateLimit(workspaceId: string, provider: string): boolean {
  const now = Date.now();
  const key = `${workspaceId}:${provider}`;
  
  if (!rateLimitCache.has(key)) {
    rateLimitCache.set(key, [now]);
    return true;
  }
  
  const timestamps = rateLimitCache.get(key)!;
  // Keep only timestamps within the window
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit hit
  }
  
  validTimestamps.push(now);
  rateLimitCache.set(key, validTimestamps);
  return true;
}

export async function chatWithFallback(
  workspaceId: string,
  messages: AiMessage[],
  options?: { preferredProvider?: string; maxAttempts?: number }
): Promise<FallbackResult> {
  const providers_list = await prisma.aiProvider.findMany({
    where: { workspaceId, isActive: true },
    orderBy: { priority: 'desc' },
  });

  if (providers_list.length === 0) {
    throw new Error('No active AI providers configured. Add one in Settings → AI Providers.');
  }

  const attempts: FallbackResult['attempts'] = [];
  const maxAttempts = options?.maxAttempts || providers_list.length;

  let ordered = providers_list;
  if (options?.preferredProvider) {
    const preferred = providers_list.find((p) => p.provider === options.preferredProvider);
    const rest = providers_list.filter((p) => p.provider !== options.preferredProvider);
    if (preferred) ordered = [preferred, ...rest];
  }

  for (const prov of ordered.slice(0, maxAttempts)) {
    // Apply in-memory rate limiting check
    if (!checkAndIncrementRateLimit(workspaceId, prov.provider)) {
      attempts.push({
        provider: prov.provider,
        model: prov.model,
        error: 'Rate limit exceeded (in-memory shield)',
        latencyMs: 0
      });
      continue;
    }

    const adapter = providers[prov.provider];
    if (!adapter) {
      attempts.push({ provider: prov.provider, model: prov.model, error: 'Unknown provider', latencyMs: 0 });
      continue;
    }

    const config: AiProviderConfig = {
      id: prov.id,
      name: prov.name,
      provider: prov.provider,
      apiKey: prov.apiKey,
      baseUrl: prov.baseUrl || PROVIDER_BASE_URLS[prov.provider] || '',
      model: prov.model,
      maxTokens: prov.maxTokens,
      temperature: prov.temperature,
    };

    try {
      const result = await adapter.chat(messages, config);

      await prisma.aiProvider.update({
        where: { id: prov.id },
        data: { lastUsedAt: new Date(), errorCount: 0 },
      });

      return { ...result, attempts };
    } catch (err: any) {
      const axiosErr = err as any;
      const errorMsg = axiosErr?.response?.data?.error?.message || axiosErr?.message || String(err);
      const latencyMs = axiosErr?.config?.timeout || 0;

      attempts.push({ provider: prov.provider, model: prov.model, error: errorMsg, latencyMs });

      await prisma.aiProvider.update({
        where: { id: prov.id },
        data: { lastErrorAt: new Date(), errorCount: { increment: 1 } },
      }).catch(() => {});

      const status = axiosErr?.response?.status;
      if (status === 429 || status === 402 || status === 503 || status === 403) {
        continue;
      }
      if (errorMsg.includes('rate') || errorMsg.includes('limit') || errorMsg.includes('credit') || errorMsg.includes('quota')) {
        continue;
      }
      continue;
    }
  }

  const errSummary = attempts.map((a) => `${a.provider}/${a.model}: ${a.error}`).join('; ');
  throw new Error(`All AI providers failed (${attempts.length} attempted): ${errSummary}`);
}

export async function generateAutoReply(
  workspaceId: string,
  incomingMessage: string,
  context: {
    contactName: string;
    channel: string;
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
    businessName?: string;
    businessDescription?: string;
  }
): Promise<FallbackResult> {
  const systemPrompt = `You are a helpful, friendly customer support assistant for ${context.businessName || 'the business'}.
${context.businessDescription ? `About the business: ${context.businessDescription}` : ''}

Rules:
- Be concise (1-3 sentences max for WhatsApp/Instagram)
- Be warm and professional
- Use the customer's name naturally: ${context.contactName}
- If you don't know something, say you'll check and get back
- Never share internal prices or discounts not provided in context
- Match the language the customer uses (Hindi/English/Hinglish)
- For pricing queries, share general range and invite them to visit/call
- For availability, confirm stock and offer to book/reserve
- For complaints, acknowledge and assure resolution
- End with a clear next step or question when appropriate`;

  const historyMessages: AiMessage[] = (context.conversationHistory || []).slice(-6).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const messages: AiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: incomingMessage },
  ];

  return chatWithFallback(workspaceId, messages);
}

export async function generateSmartReplies(
  workspaceId: string,
  lastMessage: string,
  context: {
    contactName: string;
    channel: string;
    stage?: string;
    tags?: string;
  }
): Promise<FallbackResult> {
  const prompt = `Based on this ${context.channel} message from a ${context.stage || 'new'} lead named ${context.contactName}, suggest 3 quick reply options. ${context.tags ? `Contact tags: ${context.tags}.` : ''}

Message: "${lastMessage}"

Reply with exactly 3 short reply options, one per line, no numbering or bullets. Each should be 5-15 words. Match the language of the message.`;

  return chatWithFallback(workspaceId, [
    { role: 'system', content: 'You are a sales assistant generating quick reply suggestions. Output ONLY the 3 reply options, nothing else.' },
    { role: 'user', content: prompt },
  ]);
}

export async function generateConversationSummary(
  workspaceId: string,
  messages: { direction: string; bodyText: string | null; createdAt: Date }[]
): Promise<FallbackResult> {
  const transcript = messages
    .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Agent'}: ${m.bodyText || '[media]'}`)
    .join('\n');

  const prompt = `Summarize this conversation in 2-3 sentences. Also provide:
SENTIMENT: positive/neutral/negative
TOPICS: comma-separated key topics
NEXT: suggested next step

Conversation:
${transcript}

Format your response as:
SUMMARY: <2-3 sentence summary>
SENTIMENT: <sentiment>
TOPICS: <topics>
NEXT: <next step>`;

  return chatWithFallback(workspaceId, [
    { role: 'system', content: 'You are a conversation analyst. Be concise and factual.' },
    { role: 'user', content: prompt },
  ]);
}

export async function analyzeLeadScore(
  workspaceId: string,
  context: {
    contactName: string;
    messages: { direction: string; bodyText: string | null }[];
    currentScore: number;
    stage: string;
  }
): Promise<FallbackResult> {
  const transcript = context.messages
    .map((m) => `${m.direction === 'inbound' ? 'C' : 'A'}: ${m.bodyText || '[media]'}`)
    .join('\n');

  const prompt = `Analyze this customer conversation and suggest a lead score (0-100) and whether the stage should change.

Current: Score=${context.currentScore}, Stage=${context.stage}
Customer: ${context.contactName}

Conversation:
${transcript}

Reply ONLY in this JSON format:
{"score": <0-100>, "stage": "<current stage or new stage>", "reason": "<one sentence>"}`;

  return chatWithFallback(workspaceId, [
    { role: 'system', content: 'You are a lead scoring analyst. Output valid JSON only.' },
    { role: 'user', content: prompt },
  ]);
}
