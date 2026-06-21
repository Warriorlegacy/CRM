import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { getWorkspaceLimits, checkLimit } from '../middleware/limits';

export const chatbotFlowsRouter = Router();

const FlowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.enum(['keyword', 'new_contact', 'new_ig_contact', 'no_reply']).default('keyword'),
  triggerKeyword: z.string().optional(),
  channels: z.string().default('whatsapp,instagram'),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string().optional(),
    content: z.string().optional(),
    positionX: z.number().default(0),
    positionY: z.number().default(0),
    config: z.string().optional(),
  })).default([]),
  edges: z.array(z.object({
    id: z.string(),
    sourceId: z.string(),
    targetId: z.string(),
    label: z.string().optional(),
    condition: z.string().optional(),
  })).default([]),
});

chatbotFlowsRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const flows = await prisma.chatbotFlow.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { nodes: true, edges: true, executions: true } },
    },
  });

  return res.json({ flows });
});

chatbotFlowsRouter.post('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const parsed = FlowSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });
  }

  // Check chatbot flow limit
  const limits = await getWorkspaceLimits(workspaceId);
  const flowCount = await prisma.chatbotFlow.count({ where: { workspaceId } });
  if (!checkLimit(flowCount, limits.maxChatbotFlows)) {
    return res.status(403).json({
      error: 'Limit Reached',
      message: `You've reached the chatbot flows limit for your current plan. Please upgrade to continue.`,
      limit: { current: flowCount, max: limits.maxChatbotFlows, resource: 'chatbot flows' },
    });
  }

  const { name, description, trigger, triggerKeyword, channels, nodes, edges } = parsed.data;

  const flow = await prisma.chatbotFlow.create({
    data: {
      workspaceId,
      name,
      description,
      trigger,
      triggerKeyword,
      channels,
      nodes: {
        create: nodes.map((n) => ({
          type: n.type,
          label: n.label,
          content: n.content,
          positionX: n.positionX,
          positionY: n.positionY,
          config: n.config,
        })),
      },
    },
    include: { nodes: true, edges: true },
  });

  // Create edges after nodes exist (need to map client IDs to DB IDs)
  if (edges.length > 0 && nodes.length > 0) {
    const nodeMap = new Map<string, string>();
    const dbNodes = await prisma.flowNode.findMany({ where: { flowId: flow.id } });
    nodes.forEach((clientNode, i) => {
      nodeMap.set(clientNode.id, dbNodes[i]?.id || '');
    });

    for (const edge of edges) {
      const sourceDbId = nodeMap.get(edge.sourceId);
      const targetDbId = nodeMap.get(edge.targetId);
      if (sourceDbId && targetDbId) {
        await prisma.flowEdge.create({
          data: {
            flowId: flow.id,
            sourceId: sourceDbId,
            targetId: targetDbId,
            label: edge.label,
            condition: edge.condition,
          },
        });
      }
    }
  }

  const result = await prisma.chatbotFlow.findUnique({
    where: { id: flow.id },
    include: { nodes: true, edges: true },
  });

  return res.status(201).json({ flow: result });
});

chatbotFlowsRouter.get('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const flow = await prisma.chatbotFlow.findFirst({
    where: { id, workspaceId },
    include: { nodes: true, edges: true },
  });

  if (!flow) return res.status(404).json({ error: 'Flow not found' });

  return res.json({ flow });
});

chatbotFlowsRouter.patch('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const { name, description, trigger, triggerKeyword, channels, isActive, nodes, edges } = req.body;

  const existing = await prisma.chatbotFlow.findFirst({ where: { id, workspaceId } });
  if (!existing) return res.status(404).json({ error: 'Flow not found' });

  // Update metadata
  await prisma.chatbotFlow.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(trigger !== undefined && { trigger }),
      ...(triggerKeyword !== undefined && { triggerKeyword }),
      ...(channels !== undefined && { channels }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  // If nodes/edges provided, replace entire graph
  if (nodes !== undefined && edges !== undefined) {
    // Delete old edges and nodes
    await prisma.flowEdge.deleteMany({ where: { flowId: id } });
    await prisma.flowNode.deleteMany({ where: { flowId: id } });

    // Create new nodes
    const createdNodes = await Promise.all(
      nodes.map((n: any) =>
        prisma.flowNode.create({
          data: {
            flowId: id,
            type: n.type,
            label: n.label,
            content: n.content,
            positionX: n.positionX || 0,
            positionY: n.positionY || 0,
            config: n.config,
          },
        })
      )
    );

    // Map client IDs to DB IDs and create edges
    const nodeMap = new Map<string, string>();
    nodes.forEach((clientNode: any, i: number) => {
      nodeMap.set(clientNode.id, createdNodes[i]?.id || '');
    });

    for (const edge of edges) {
      const sourceDbId = nodeMap.get(edge.sourceId);
      const targetDbId = nodeMap.get(edge.targetId);
      if (sourceDbId && targetDbId) {
        await prisma.flowEdge.create({
          data: {
            flowId: id,
            sourceId: sourceDbId,
            targetId: targetDbId,
            label: edge.label,
            condition: edge.condition,
          },
        });
      }
    }
  }

  const updated = await prisma.chatbotFlow.findUnique({
    where: { id },
    include: { nodes: true, edges: true },
  });

  return res.json({ flow: updated });
});

chatbotFlowsRouter.patch('/:id/toggle', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const flow = await prisma.chatbotFlow.findFirst({ where: { id, workspaceId } });
  if (!flow) return res.status(404).json({ error: 'Flow not found' });

  await prisma.chatbotFlow.update({
    where: { id },
    data: { isActive: !flow.isActive },
  });

  return res.json({ ok: true, isActive: !flow.isActive });
});

chatbotFlowsRouter.delete('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const deleted = await prisma.chatbotFlow.deleteMany({ where: { id, workspaceId } });
  if (deleted.count === 0) return res.status(404).json({ error: 'Flow not found' });

  return res.status(204).send();
});

export default chatbotFlowsRouter;
