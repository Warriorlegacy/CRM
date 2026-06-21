import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

export const scheduledMessageRouter = Router();

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

scheduledMessageRouter.use(extractAuth);

const ScheduledMessageSchema = z.object({
  contactIds: z.array(z.string()).min(1),
  message: z.string().min(1),
  scheduledAt: z.string().transform((val) => new Date(val)),
});

scheduledMessageRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { status } = req.query;

  const where: any = { workspaceId };
  if (status === 'pending') {
    where.scheduledAt = { gte: new Date() };
    where.status = 'pending';
  } else if (status === 'sent') {
    where.status = 'sent';
  }

  const messages = await prisma.$queryRaw<any[]>`
    SELECT * FROM ScheduledMessage 
    WHERE workspaceId = ${workspaceId}
    ${status === 'pending' ? require('prisma').$queryRaw`AND scheduledAt >= ${new Date()} AND status = 'pending'` : require('prisma').$queryRaw``}
    ORDER BY scheduledAt ASC
    LIMIT 100
  `;

  return res.json({ ok: true, messages });
});

scheduledMessageRouter.post('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const parsed = ScheduledMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: parsed.error.flatten() 
    });
  }

  const { contactIds, message, scheduledAt } = parsed.data;

  if (new Date(scheduledAt) <= new Date()) {
    return res.status(400).json({
      error: 'Scheduled time must be in the future',
    });
  }

  const results = [];
  for (const contactId of contactIds) {
    await prisma.$executeRaw`
      INSERT INTO ScheduledMessage (id, workspaceId, contactId, message, "scheduledAt", status, "createdAt", "updatedAt")
      VALUES (
        ${require('crypto').randomUUID()},
        ${workspaceId},
        ${contactId},
        ${message},
        ${scheduledAt},
        'pending',
        ${new Date()},
        ${new Date()}
      )
    `;
    results.push(contactId);
  }

  return res.json({ 
    ok: true, 
    message: `Scheduled ${results.length} messages`,
  });
});

scheduledMessageRouter.delete('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  await prisma.$executeRaw`
    DELETE FROM ScheduledMessage 
    WHERE id = ${id} AND workspaceId = ${workspaceId}
  `;

  return res.json({ ok: true, message: 'Scheduled message cancelled' });
});

export default scheduledMessageRouter;
