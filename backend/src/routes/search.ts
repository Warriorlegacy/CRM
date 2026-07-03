import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

export const searchRouter = Router();

searchRouter.get('/messages', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { q, limit = '50', offset = '0' } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const queryString = (q as string).trim();
  const take = Math.min(parseInt(limit as string), 100);
  const skip = parseInt(offset as string) || 0;

  const whereClause: Record<string, unknown> = {
    workspaceId,
    OR: [
      { bodyText: { contains: queryString, mode: 'insensitive' } },
    ],
  };

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        conversation: {
          select: { id: true, status: true, channel: true },
        },
        contact: {
          select: { id: true, name: true, phone: true, email: true },
        },
        sentByUser: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.message.count({ where: whereClause }),
  ]);

  return res.json({
    ok: true,
    messages: messages.map((m) => ({
      id: m.id,
      workspaceId: m.workspaceId,
      conversationId: m.conversationId,
      contactId: m.contactId,
      channel: m.channel,
      direction: m.direction,
      type: m.type,
      bodyText: m.bodyText,
      waMessageId: m.waMessageId,
      igMessageId: m.igMessageId,
      sentByUserId: m.sentByUserId,
      readAt: m.readAt,
      createdAt: m.createdAt,
      contact: m.contact,
      conversation: m.conversation,
      sentByUser: m.sentByUser,
    })),
    pagination: {
      total,
      limit: take,
      offset: skip,
      hasMore: skip + take < total,
    },
  });
});

searchRouter.get('/contacts', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { q, limit = '50', offset = '0' } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const take = Math.min(parseInt(limit as string), 100);
  const skip = parseInt(offset as string) || 0;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
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
      take,
      skip,
      include: {
        assignedTo: {
          select: { name: true },
        },
      },
    }),
    prisma.contact.count({
      where: {
        workspaceId,
        OR: [
          { name: { contains: q as string } },
          { phone: { contains: q as string } },
          { email: { contains: q as string } },
          { tags: { contains: q as string } },
        ],
      },
    }),
  ]);

  return res.json({
    ok: true,
    contacts,
    pagination: {
      total,
      limit: take,
      offset: skip,
      hasMore: skip + take < total,
    },
  });
});

searchRouter.get('/global', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { q, limit = '20', offset = '0' } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const take = Math.min(parseInt(limit as string), 100);
  const skip = parseInt(offset as string) || 0;

  const [messages, contacts] = await Promise.all([
    prisma.message.findMany({
      where: {
        workspaceId,
        bodyText: { contains: q as string },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
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
      take,
      skip,
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
    },
    pagination: {
      limit: take,
      offset: skip,
    },
  });
});

export default searchRouter;
