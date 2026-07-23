import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../middleware/auth';
import { CHATBOT_TEMPLATES, createFlowFromTemplate } from '../services/chatbotTemplates';
import { processAutomation } from '../services/aiAutomation';

export const automationRouter = Router();

automationRouter.get('/templates', async (_req, res) => {
  return res.json({ templates: CHATBOT_TEMPLATES });
});

automationRouter.post('/templates/:templateId/use', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { templateId } = req.params;

  const flowId = await createFlowFromTemplate(workspaceId, templateId);
  if (!flowId) {
    return res.status(404).json({ error: 'Template not found' });
  }

  return res.json({ ok: true, flowId });
});

automationRouter.get('/stats', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const [totalAutoReplies, recentLogs, activeFlows, totalExecutions] = await Promise.all([
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
        aiReply: true,
        incomingMessage: true,
      },
    }),
    prisma.chatbotFlow.count({ where: { workspaceId, isActive: true } }),
    prisma.flowExecution.count({ where: { flowId: { not: '' } } }),
  ]);

  const recentContacts = await prisma.contact.findMany({
    where: { workspaceId, tags: { not: '' } },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    select: { tags: true },
  });

  const categoryCounts: Record<string, number> = {};
  for (const contact of recentContacts) {
    if (contact.tags) {
      const tags = contact.tags.split(',').map(t => t.trim());
      for (const tag of tags) {
        if (['support', 'sales', 'billing', 'complaint', 'inquiry', 'general'].includes(tag)) {
          categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
        }
      }
    }
  }

  return res.json({
    stats: {
      totalAutoReplies,
      activeFlows,
      totalExecutions,
      categories: categoryCounts,
    },
    recentLogs,
  });
});

automationRouter.post('/analyze', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { messageText, contactName } = req.body;

  if (!messageText) {
    return res.status(400).json({ error: 'messageText is required' });
  }

  const result = await processAutomation({
    workspaceId,
    contactId: '',
    conversationId: '',
    channel: 'whatsapp',
    messageText,
    contactName: contactName || 'Customer',
  });

  return res.json({ analysis: result });
});

// ── Automation Rules CRUD ──────────────────────────────────────────────
automationRouter.get('/rules', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const rules = await prisma.automationRule.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ rules });
});

automationRouter.post('/rules', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { name, triggerType, conditionsJson, actionsJson } = req.body;

  if (!name || !triggerType) {
    return res.status(400).json({ error: 'Name and triggerType are required' });
  }

  const rule = await prisma.automationRule.create({
    data: {
      workspaceId,
      name,
      triggerType,
      conditionsJson: typeof conditionsJson === 'string' ? conditionsJson : JSON.stringify(conditionsJson || []),
      actionsJson: typeof actionsJson === 'string' ? actionsJson : JSON.stringify(actionsJson || []),
    },
  });

  return res.status(201).json({ rule });
});

automationRouter.delete('/rules/:id', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const deleted = await prisma.automationRule.deleteMany({
    where: { id, workspaceId },
  });

  if (deleted.count === 0) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  return res.status(204).send();
});

export default automationRouter;
