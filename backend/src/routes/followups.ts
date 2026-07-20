import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { createNotification } from './notifications';

export const followupsRouter = Router();

const CreateFollowupSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  dueAt: z.string().transform((val) => new Date(val)),
  note: z.string().max(1000).optional(),
  assignedToId: z.string().optional().nullable(),
  isRecurring: z.boolean().optional().default(false),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

followupsRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const userId = (req as any).userId;
  const { status, assignedToId, overdue, today, upcoming } = req.query;

  const where: any = { workspaceId };

  if (status && status !== 'all') {
    where.status = status;
  }

  if (assignedToId === 'me') {
    where.assignedToId = userId;
  } else if (assignedToId) {
    where.assignedToId = assignedToId as string;
  }

  if (overdue === 'true') {
    where.dueAt = { lte: new Date() };
    where.status = 'pending';
  }

  if (today === 'true') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    where.dueAt = { gte: startOfDay, lte: endOfDay };
  }

  if (upcoming === 'true') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    where.dueAt = { gte: tomorrow };
    where.status = 'pending';
  }

  const followups = await prisma.followup.findMany({
    where,
    orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
    include: {
      contact: {
        select: { id: true, name: true, phone: true, stage: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const stats = {
    total: await prisma.followup.count({ where: { workspaceId, status: 'pending' } }),
    overdue: await prisma.followup.count({ 
      where: { workspaceId, status: 'pending', dueAt: { lte: new Date() } } 
    }),
    today: await prisma.followup.count({
      where: {
        workspaceId,
        status: 'pending',
        dueAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  };

  return res.json({ ok: true, followups, stats });
});

followupsRouter.post('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const parsed = CreateFollowupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: parsed.error.flatten() 
    });
  }

  const { contactId, dueAt, note, assignedToId, isRecurring, recurringInterval } = parsed.data;

  const followup = await prisma.followup.create({
    data: {
      workspaceId,
      contactId,
      dueAt,
      note,
      assignedToId,
      status: 'pending',
    },
    include: {
      contact: {
        select: { id: true, name: true, phone: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
    },
  });

  // Create notification for new follow-up
  try {
    const contactName = followup.contact?.name || followup.contact?.phone || 'Contact';
    const isOverdue = new Date(dueAt) <= new Date();
    await createNotification(workspaceId, {
      type: 'followup_due',
      title: isOverdue ? `⚠️ Overdue follow-up: ${contactName}` : `Follow-up scheduled: ${contactName}`,
      message: (note || `Follow-up due ${isOverdue ? 'now' : dueAt.toLocaleDateString()}`).substring(0, 120),
      link: '/followups',
    });
  } catch (e) {
    console.error('Failed to create notification for follow-up:', e);
  }

  return res.json({ ok: true, followup });
});

followupsRouter.patch('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const { dueAt, note, assignedToId, status } = req.body;

  const followup = await prisma.followup.updateMany({
    where: { id, workspaceId },
    data: { 
      ...(dueAt && { dueAt: new Date(dueAt) }),
      ...(note !== undefined && { note }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(status && { status }),
    },
  });

  if (followup.count === 0) {
    return res.status(404).json({ error: 'Followup not found' });
  }

  return res.json({ ok: true });
});

followupsRouter.patch('/:id/done', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const existing = await prisma.followup.findFirst({
    where: { id, workspaceId },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Followup not found' });
  }

  const followup = await prisma.followup.update({
    where: { id },
    data: { status: 'completed' },
  });

  return res.json({ ok: true, followup });
});

followupsRouter.patch('/:id/cancel', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const followup = await prisma.followup.updateMany({
    where: { id, workspaceId },
    data: { status: 'cancelled' },
  });

  if (followup.count === 0) {
    return res.status(404).json({ error: 'Followup not found' });
  }

  return res.json({ ok: true });
});

followupsRouter.delete('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const followup = await prisma.followup.deleteMany({
    where: { id, workspaceId },
  });

  if (followup.count === 0) {
    return res.status(404).json({ error: 'Followup not found' });
  }

  return res.json({ ok: true });
});

export default followupsRouter;
