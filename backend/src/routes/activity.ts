import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const activityRouter = Router();

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

activityRouter.use(extractAuth);

activityRouter.get('/contact/:contactId', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { contactId } = req.params;
  const { limit = '50' } = req.query;

  const messages = await prisma.message.findMany({
    where: { workspaceId, contactId },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    include: {
      sentByUser: {
        select: { name: true, email: true },
      },
    },
  });

  const followups = await prisma.followup.findMany({
    where: { workspaceId, contactId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      assignedTo: {
        select: { name: true },
      },
    },
  });

  const activities = [
    ...messages.map(m => ({
      id: m.id,
      type: m.direction === 'inbound' ? 'message_received' : 'message_sent',
      description: m.direction === 'inbound' ? 'Received message' : 'Sent message',
      details: m.bodyText,
      createdAt: m.createdAt,
      user: m.sentByUser?.name || 'Customer',
    })),
    ...followups.map(f => ({
      id: f.id,
      type: f.status === 'completed' ? 'followup_completed' : 'followup_created',
      description: f.status === 'completed' ? 'Follow-up completed' : 'Follow-up scheduled',
      details: f.note,
      createdAt: f.createdAt,
      user: f.assignedTo?.name || 'System',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ ok: true, activities });
});

activityRouter.get('/workspace', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { limit = '100' } = req.query;

  const messages = await prisma.message.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    include: {
      contact: {
        select: { name: true, phone: true },
      },
      sentByUser: {
        select: { name: true },
      },
    },
  });

  const activities = messages.map(m => ({
    id: m.id,
    type: m.direction === 'inbound' ? 'message_received' : 'message_sent',
    contactName: m.contact.name || m.contact.phone,
    description: m.direction === 'inbound' ? 'Received message' : 'Sent message',
    preview: m.bodyText?.substring(0, 50) + (m.bodyText && m.bodyText.length > 50 ? '...' : ''),
    createdAt: m.createdAt,
    user: m.sentByUser?.name || 'Customer',
  }));

  return res.json({ ok: true, activities });
});

export default activityRouter;
