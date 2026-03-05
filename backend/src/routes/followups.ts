import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const followupsRouter = Router();

// Middleware to extract auth headers
const extractAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.header('x-user-id');
  const workspaceId = req.header('x-workspace-id');

  if (!userId || !workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-user-id or x-workspace-id headers',
    });
  }

  (req as any).userId = userId;
  (req as any).workspaceId = workspaceId;
  next();
};

followupsRouter.use(extractAuth);

followupsRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { status, assignedToId } = req.query;

  const where: any = { workspaceId };

  if (status) {
    where.status = status;
  }

  if (assignedToId) {
    where.assignedToId = assignedToId as string;
  }

  const followups = await prisma.followup.findMany({
    where,
    orderBy: { dueAt: 'asc' },
    include: {
      contact: {
        select: { id: true, name: true, phone: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
    },
  });

  return res.json({ ok: true, followups });
});

followupsRouter.post('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { contactId, dueAt, note, assignedToId } = req.body;

  const followup = await prisma.followup.create({
    data: {
      workspaceId,
      contactId,
      dueAt: new Date(dueAt),
      note,
      assignedToId,
      status: 'pending',
    },
  });

  return res.json({ ok: true, followup });
});

followupsRouter.patch('/:id/done', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const followup = await prisma.followup.updateMany({
    where: { id, workspaceId },
    data: { status: 'done' },
  });

  if (followup.count === 0) {
    return res.status(404).json({ error: 'Followup not found' });
  }

  return res.json({ ok: true });
});

export default followupsRouter;
