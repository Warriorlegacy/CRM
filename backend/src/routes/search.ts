import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const searchRouter = Router();

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

searchRouter.use(extractAuth);

searchRouter.get('/messages', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { q, limit = '50' } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const messages = await prisma.message.findMany({
    where: {
      workspaceId,
      bodyText: {
        contains: q as string,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    include: {
      contact: {
        select: { id: true, name: true, phone: true },
      },
      sentByUser: {
        select: { name: true },
      },
    },
  });

  return res.json({ ok: true, messages });
});

searchRouter.get('/contacts', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { q, limit = '50' } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const contacts = await prisma.contact.findMany({
    where: {
      workspaceId,
      OR: [
        { name: { contains: q as string } },
        { phone: { contains: q as string } },
        { email: { contains: q as string } },
        { tags: { contains: q as string } },
      ],
    },
    orderBy: { lastMessageAt: 'desc' },
    take: parseInt(limit as string),
    include: {
      assignedTo: {
        select: { name: true },
      },
    },
  });

  return res.json({ ok: true, contacts });
});

searchRouter.get('/global', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { q, limit = '20' } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const [messages, contacts] = await Promise.all([
    prisma.message.findMany({
      where: {
        workspaceId,
        bodyText: { contains: q as string },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      include: {
        contact: {
          select: { id: true, name: true, phone: true },
        },
      },
    }),
    prisma.contact.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: q as string } },
          { phone: { contains: q as string } },
          { email: { contains: q as string } },
        ],
      },
      orderBy: { lastMessageAt: 'desc' },
      take: parseInt(limit as string),
    }),
  ]);

  return res.json({ 
    ok: true, 
    results: {
      messages: messages.map(m => ({
        id: m.id,
        type: 'message',
        contactName: m.contact.name || m.contact.phone,
        preview: m.bodyText?.substring(0, 100),
        createdAt: m.createdAt,
      })),
      contacts: contacts.map(c => ({
        id: c.id,
        type: 'contact',
        name: c.name || c.phone,
        phone: c.phone,
        stage: c.stage,
      })),
    } 
  });
});

export default searchRouter;
