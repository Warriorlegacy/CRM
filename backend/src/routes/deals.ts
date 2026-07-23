import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

export const dealsRouter = Router();

dealsRouter.use(requireAuth);

// ── Default Pipeline Stages Initializer ─────────────────────────────────
async function ensureDefaultStages(workspaceId: string) {
  const existing = await prisma.pipelineStage.findFirst({ where: { workspaceId } });
  if (!existing) {
    const defaults = [
      { name: 'New Lead', order: 0, color: '#6366f1', probability: 10 },
      { name: 'Qualified', order: 1, color: '#0EA5E9', probability: 30 },
      { name: 'Proposition', order: 2, color: '#F59E0B', probability: 60 },
      { name: 'Negotiation', order: 3, color: '#EC4899', probability: 80 },
      { name: 'Won', order: 4, color: '#10B981', probability: 100 },
      { name: 'Lost', order: 5, color: '#EF4444', probability: 0 },
    ];
    for (const st of defaults) {
      await prisma.pipelineStage.create({
        data: { workspaceId, ...st },
      });
    }
  }
}

// ── GET /api/v1/deals/stages — Get pipeline stages ──────────────────────
dealsRouter.get('/stages', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  await ensureDefaultStages(workspaceId);

  const stages = await prisma.pipelineStage.findMany({
    where: { workspaceId },
    orderBy: { order: 'asc' },
  });

  return res.json({ stages });
});

// ── GET /api/v1/deals — Get deals grouped by stage (Kanban View) ─────────
dealsRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  await ensureDefaultStages(workspaceId);

  const stages = await prisma.pipelineStage.findMany({
    where: { workspaceId },
    orderBy: { order: 'asc' },
    include: {
      deals: {
        include: {
          contact: {
            select: { id: true, name: true, phone: true, email: true, profilePicture: true, stage: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  return res.json({ stages });
});

// ── POST /api/v1/deals — Create a new deal ──────────────────────────────
const CreateDealSchema = z.object({
  contactId: z.string().min(1),
  title: z.string().min(1),
  value: z.number().nonnegative().default(0),
  currency: z.string().default('USD'),
  stageId: z.string().min(1),
  assignedToId: z.string().optional(),
  expectedCloseAt: z.string().optional(),
});

dealsRouter.post('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const parsed = CreateDealSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });
  }

  const deal = await prisma.deal.create({
    data: {
      workspaceId,
      contactId: parsed.data.contactId,
      title: parsed.data.title,
      value: parsed.data.value,
      currency: parsed.data.currency,
      stageId: parsed.data.stageId,
      assignedToId: parsed.data.assignedToId,
      expectedCloseAt: parsed.data.expectedCloseAt ? new Date(parsed.data.expectedCloseAt) : null,
    },
    include: {
      contact: {
        select: { id: true, name: true, phone: true, email: true },
      },
      stage: true,
    },
  });

  return res.status(201).json({ deal });
});

// ── PATCH /api/v1/deals/:id/stage — Move deal to new stage ───────────────
dealsRouter.patch('/:id/stage', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const { stageId, status, lostReason } = req.body;

  const existing = await prisma.deal.findFirst({ where: { id, workspaceId } });
  if (!existing) return res.status(404).json({ error: 'Deal not found' });

  const targetStage = await prisma.pipelineStage.findFirst({ where: { id: stageId, workspaceId } });
  if (!targetStage) return res.status(404).json({ error: 'Target stage not found' });

  let computedStatus = status || existing.status;
  if (targetStage.name.toLowerCase().includes('won')) computedStatus = 'won';
  if (targetStage.name.toLowerCase().includes('lost')) computedStatus = 'lost';

  const updated = await prisma.deal.update({
    where: { id },
    data: {
      stageId,
      status: computedStatus,
      ...(lostReason !== undefined && { lostReason }),
    },
    include: { stage: true, contact: true },
  });

  return res.json({ deal: updated });
});

// ── DELETE /api/v1/deals/:id — Delete deal ──────────────────────────────
dealsRouter.delete('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const deleted = await prisma.deal.deleteMany({ where: { id, workspaceId } });
  if (deleted.count === 0) return res.status(404).json({ error: 'Deal not found' });

  return res.status(204).send();
});
