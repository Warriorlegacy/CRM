import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { providers, FREE_MODELS, isBuiltinProvider, getProviderAdapter } from '../ai/providers';
import { chatWithFallback, generateAutoReply, generateSmartReplies, generateConversationSummary, analyzeLeadScore, detectLanguage, getLanguageName } from '../ai/chain';

export const aiRouter = Router();

// ── Language Detection ────────────────────────────────────────────────

const DetectLanguageSchema = z.object({ message: z.string().min(1) });

aiRouter.post('/detect-language', async (req, res) => {
  const { message } = req.body;
  const parsed = DetectLanguageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });

  try {
    const code = await detectLanguage(parsed.data.message);
    return res.json({ language: code, name: getLanguageName(code) });
  } catch (err: any) {
    return res.status(502).json({ error: err.message });
  }
});

// ── AI Status & Metrics Endpoint ───────────────────────────────────────

aiRouter.get('/status', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  try {
    const [totalProviders, activeProviders, recentAutoReplies, logs] = await Promise.all([
      prisma.aiProvider.count({ where: { workspaceId } }),
      prisma.aiProvider.count({ where: { workspaceId, isActive: true } }),
      prisma.aiAutoReplyLog.count({ where: { workspaceId } }),
      prisma.aiAutoReplyLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          provider: true,
          model: true,
          latencyMs: true,
          wasSent: true,
          createdAt: true,
        },
      }),
    ]);

    const totalLatency = logs.reduce((acc, l) => acc + (l.latencyMs || 0), 0);
    const avgLatencyMs = logs.length > 0 ? Math.round(totalLatency / logs.length) : 0;

    return res.json({
      totalProviders,
      activeProviders,
      recentAutoReplies,
      avgLatencyMs,
      recentLogs: logs,
    });
  } catch (err: any) {
    return res.json({
      totalProviders: 0,
      activeProviders: 0,
      recentAutoReplies: 0,
      avgLatencyMs: 0,
      recentLogs: [],
    });
  }
});

// ── Provider CRUD ──────────────────────────────────────────────────────

aiRouter.get('/providers', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const provs = await prisma.aiProvider.findMany({
    where: { workspaceId },
    orderBy: { priority: 'desc' },
    select: {
      id: true, name: true, provider: true, model: true, priority: true,
      isActive: true, maxTokens: true, temperature: true, baseUrl: true,
      lastUsedAt: true, lastErrorAt: true, errorCount: true, createdAt: true,
    },
  });
  return res.json({ providers: provs });
});

aiRouter.get('/providers/models', async (req, res) => {
  return res.json({ models: FREE_MODELS });
});

aiRouter.get('/providers/available', async (_req, res) => {
  const builtinProviders = Object.keys(providers)
    .filter((k) => k !== 'custom')
    .map((k) => ({
      id: k,
      name: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      models: FREE_MODELS[k] || [],
    }));

  // Universal custom provider option at top — works with ANY OpenAI-compatible endpoint
  const availableProviders = [
    {
      id: '__custom__',
      name: '✨ Custom (OpenAI-compatible)',
      models: [{ model: '', name: 'Type any model name below' }],
    },
    ...builtinProviders,
  ];

  return res.json({ providers: availableProviders });
});

const ProviderSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  apiKey: z.string().min(1),
  baseUrl: z.string().optional(),
  model: z.string().min(1),
  priority: z.number().default(0),
  maxTokens: z.number().default(1024),
  temperature: z.number().min(0).max(2).default(0.7),
}).refine(
  (data) => {
    // If it's a custom provider (not a built-in one), require baseUrl
    if (!isBuiltinProvider(data.provider) && data.provider !== '__custom__') {
      return !!data.baseUrl;
    }
    return true;
  },
  { message: 'Base URL is required for custom providers', path: ['baseUrl'] }
);

aiRouter.post('/providers', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const parsed = ProviderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });

  const provider = await prisma.aiProvider.create({
    data: { workspaceId, ...parsed.data },
    select: {
      id: true, name: true, provider: true, model: true, priority: true,
      isActive: true, maxTokens: true, temperature: true, baseUrl: true, createdAt: true,
    },
  });
  return res.status(201).json({ provider });
});

aiRouter.patch('/providers/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const existing = await prisma.aiProvider.findFirst({ where: { id, workspaceId } });
  if (!existing) return res.status(404).json({ error: 'Provider not found' });

  const { name, apiKey, baseUrl, model, priority, maxTokens, temperature, isActive } = req.body;
  const updated = await prisma.aiProvider.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(apiKey !== undefined && { apiKey }),
      ...(baseUrl !== undefined && { baseUrl }),
      ...(model !== undefined && { model }),
      ...(priority !== undefined && { priority }),
      ...(maxTokens !== undefined && { maxTokens }),
      ...(temperature !== undefined && { temperature }),
      ...(isActive !== undefined && { isActive }),
    },
    select: {
      id: true, name: true, provider: true, model: true, priority: true,
      isActive: true, maxTokens: true, temperature: true, baseUrl: true, createdAt: true,
    },
  });
  return res.json({ provider: updated });
});

aiRouter.delete('/providers/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const deleted = await prisma.aiProvider.deleteMany({ where: { id, workspaceId } });
  if (deleted.count === 0) return res.status(404).json({ error: 'Provider not found' });
  return res.status(204).send();
});

const TestKeySchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().min(1),
  model: z.string().min(1),
  baseUrl: z.string().optional(),
});

aiRouter.post('/test-key', async (req, res) => {
  const parsed = TestKeySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });

  const { provider, apiKey, model, baseUrl } = parsed.data;
  const adapter = getProviderAdapter(provider, baseUrl);

  if (!adapter) {
    return res.json({ ok: false, error: 'Unknown or unsupported provider' });
  }

  try {
    const start = Date.now();
    const result = await adapter.chat(
      [{ role: 'user', content: 'Say hello in 3 words' }],
      {
        id: 'test',
        name: 'test',
        provider,
        apiKey,
        baseUrl: baseUrl || '',
        model,
        maxTokens: 50,
        temperature: 0.7,
      }
    );
    return res.json({ ok: true, latencyMs: Date.now() - start, response: result.content });
  } catch (err: any) {
    return res.json({ ok: false, error: err?.response?.data?.error?.message || err?.message || 'Connection failed' });
  }
});

aiRouter.post('/providers/:id/test', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const prov = await prisma.aiProvider.findFirst({ where: { id, workspaceId } });
  if (!prov) return res.status(404).json({ error: 'Provider not found' });

  const adapter = getProviderAdapter(prov.provider, prov.baseUrl || undefined);
  if (!adapter) return res.json({ ok: false, error: 'Unsupported provider' });

  try {
    const start = Date.now();
    const result = await adapter.chat(
      [{ role: 'user', content: 'Say hello in 3 words' }],
      {
        id: prov.id,
        name: prov.name,
        provider: prov.provider,
        apiKey: prov.apiKey,
        baseUrl: prov.baseUrl || '',
        model: prov.model,
        maxTokens: prov.maxTokens || 100,
        temperature: prov.temperature || 0.7,
      }
    );
    return res.json({ ok: true, response: result.content, latencyMs: Date.now() - start, provider: prov.provider, model: prov.model });
  } catch (err: any) {
    return res.json({ ok: false, error: err?.response?.data?.error?.message || err?.message || 'Connection failed' });
  }
});

// ── AI Chat (generic) ─────────────────────────────────────────────────

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  preferredProvider: z.string().optional(),
});

aiRouter.post('/chat', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });

  try {
    const result = await chatWithFallback(workspaceId, parsed.data.messages, {
      preferredProvider: parsed.data.preferredProvider,
    });
    return res.json({
      content: result.content,
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
    });
  } catch (err: any) {
    return res.status(502).json({ error: err.message });
  }
});

// ── Smart Reply Suggestions ───────────────────────────────────────────

const SmartReplySchema = z.object({
  conversationId: z.string(),
  lastMessage: z.string(),
});

aiRouter.post('/smart-reply', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const parsed = SmartReplySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });

  const conversation = await prisma.conversation.findFirst({
    where: { id: parsed.data.conversationId, workspaceId },
    include: { contact: true },
  });
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  try {
    const result = await generateSmartReplies(workspaceId, parsed.data.lastMessage, {
      contactName: conversation.contact.name || 'Customer',
      channel: conversation.channel,
      stage: conversation.contact.stage,
      tags: conversation.contact.tags,
    });
    const suggestions = result.content.split('\n').filter((l) => l.trim()).slice(0, 3);
    return res.json({ suggestions, provider: result.provider, model: result.model });
  } catch (err: any) {
    return res.status(502).json({ error: err.message });
  }
});

// ── Auto-Reply ────────────────────────────────────────────────────────

const AutoReplySchema = z.object({
  conversationId: z.string(),
  message: z.string(),
  sendImmediately: z.boolean().default(false),
});

aiRouter.post('/auto-reply', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const parsed = AutoReplySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });

  const conversation = await prisma.conversation.findFirst({
    where: { id: parsed.data.conversationId, workspaceId },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const history = conversation.messages.reverse().map((m) => ({
    role: (m.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.bodyText || '[media]',
  }));

  try {
    const result = await generateAutoReply(workspaceId, parsed.data.message, {
      contactName: conversation.contact.name || 'Customer',
      channel: conversation.channel,
      conversationHistory: history,
    });

    await prisma.aiAutoReplyLog.create({
      data: {
        workspaceId,
        conversationId: conversation.id,
        contactId: conversation.contactId,
        incomingMessage: parsed.data.message,
        aiReply: result.content,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        wasSent: parsed.data.sendImmediately,
      },
    });

    if (parsed.data.sendImmediately) {
      const { sendWhatsAppText } = await import('../whatsapp/meta');
      const waAccount = await prisma.waAccount.findUnique({ where: { workspaceId } });
      if (waAccount && conversation.channel === 'whatsapp') {
        await sendWhatsAppText({
          accessToken: waAccount.accessToken,
          phoneNumberId: waAccount.phoneNumberId,
          to: conversation.contact.phone,
          text: result.content,
        });
        await prisma.message.create({
          data: {
            workspaceId,
            conversationId: conversation.id,
            contactId: conversation.contactId,
            channel: 'whatsapp',
            direction: 'outbound',
            type: 'text',
            bodyText: result.content,
          },
        });
      }
    }

    return res.json({
      reply: result.content,
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
      sent: parsed.data.sendImmediately,
    });
  } catch (err: any) {
    return res.status(502).json({ error: err.message });
  }
});

// ── Conversation Summary ──────────────────────────────────────────────

aiRouter.post('/summarize', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { conversationId } = req.body;
  if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  try {
    const result = await generateConversationSummary(workspaceId, conversation.messages);
    const lines = result.content.split('\n');
    const summary = lines.find((l) => l.startsWith('SUMMARY:'))?.replace('SUMMARY:', '').trim() || result.content;
    const sentiment = lines.find((l) => l.startsWith('SENTIMENT:'))?.replace('SENTIMENT:', '').trim();
    const keyTopics = lines.find((l) => l.startsWith('TOPICS:'))?.replace('TOPICS:', '').trim();
    const nextSteps = lines.find((l) => l.startsWith('NEXT:'))?.replace('NEXT:', '').trim();

    const saved = await prisma.aiConversationSummary.create({
      data: {
        workspaceId,
        conversationId,
        summary,
        sentiment: sentiment || null,
        keyTopics: keyTopics || null,
        nextSteps: nextSteps || null,
      },
    });

    return res.json({ summary: saved, provider: result.provider, model: result.model });
  } catch (err: any) {
    return res.status(502).json({ error: err.message });
  }
});

// ── Lead Score Analysis ───────────────────────────────────────────────

aiRouter.post('/lead-score', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { contactId } = req.body;
  if (!contactId) return res.status(400).json({ error: 'contactId required' });

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  try {
    const result = await analyzeLeadScore(workspaceId, {
      contactName: contact.name || 'Customer',
      messages: contact.messages,
      currentScore: contact.leadScore,
      stage: contact.stage,
    });

    let analysis;
    try {
      analysis = JSON.parse(result.content);
    } catch {
      const match = result.content.match(/\{[\s\S]*\}/);
      analysis = match ? JSON.parse(match[0]) : { score: contact.leadScore, stage: contact.stage, reason: result.content };
    }

    if (typeof analysis.score === 'number' && analysis.score !== contact.leadScore) {
      await prisma.contact.update({ where: { id: contactId }, data: { leadScore: analysis.score } });
    }
    if (analysis.stage && analysis.stage !== contact.stage) {
      await prisma.contact.update({ where: { id: contactId }, data: { stage: analysis.stage } });
    }

    return res.json({ analysis, previousScore: contact.leadScore, provider: result.provider });
  } catch (err: any) {
    return res.status(502).json({ error: err.message });
  }
});

// ── AI Status ─────────────────────────────────────────────────────────

aiRouter.get('/status', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const [providerCount, activeCount, recentLogs] = await Promise.all([
    prisma.aiProvider.count({ where: { workspaceId } }),
    prisma.aiProvider.count({ where: { workspaceId, isActive: true } }),
    prisma.aiAutoReplyLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, provider: true, model: true, latencyMs: true,
        wasSent: true, createdAt: true,
      },
    }),
  ]);

  const avgLatency = recentLogs.length > 0
    ? Math.round(recentLogs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / recentLogs.length)
    : 0;

  return res.json({
    totalProviders: providerCount,
    activeProviders: activeCount,
    recentAutoReplies: recentLogs.length,
    avgLatencyMs: avgLatency,
    recentLogs,
  });
});
