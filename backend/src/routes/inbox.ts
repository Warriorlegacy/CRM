import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

interface AuthRequest extends Request {
  userId: string;
  workspaceId: string;
}

export const inboxRouter = Router();

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

inboxRouter.use(extractAuth);

inboxRouter.get('/conversations', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const conversations = await prisma.conversation.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
    include: {
      contact: {
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const data = conversations.map((c) => ({
    id: c.id,
    contactId: c.contactId,
    name: c.contact.name,
    phone: c.contact.phone,
    stage: c.contact.stage,
    assignedToId: c.contact.assignedToId,
    assignedTo: c.contact.assignedTo,
    unreadCount: c.contact.unreadCount,
    lastMessage: c.messages[0]?.bodyText || '',
    lastMessageAt: c.messages[0]?.createdAt || null,
    status: c.status,
  }));

  return res.json({ ok: true, conversations: data });
});

inboxRouter.get('/conversations/:id/messages', async (req, res) => {
  const userId = (req as any).userId;
  const workspaceId = (req as any).workspaceId;
  const conversationId = req.params.id;

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
  });

  if (!convo) return res.status(404).json({ error: 'Conversation not found' });

  const msgs = await prisma.message.findMany({
    where: { conversationId, workspaceId },
    orderBy: { createdAt: 'asc' },
    include: {
      sentByUser: {
        select: { id: true, name: true },
      },
      readReceipts: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  // Mark messages as read
  const unreadMessages = msgs.filter(
    (m) => m.direction === 'inbound' && !m.readReceipts.some((r) => r.userId === userId)
  );

  if (unreadMessages.length > 0) {
    await prisma.$transaction(
      unreadMessages.map((message) =>
        prisma.readReceipt.create({
          data: {
            messageId: message.id,
            userId,
          },
        })
      )
    );

    // Reset unread count
    await prisma.contact.update({
      where: { id: convo.contactId },
      data: { unreadCount: 0 },
    });
  }

  return res.json({ ok: true, messages: msgs });
});

inboxRouter.patch('/conversations/:id/assign', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const conversationId = req.params.id;
  const { assignedToId } = req.body;

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { contact: true },
  });

  if (!convo) return res.status(404).json({ error: 'Conversation not found' });

  await prisma.contact.update({
    where: { id: convo.contactId },
    data: { assignedToId },
  });

  return res.json({ ok: true });
});

inboxRouter.patch('/conversations/:id/stage', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const conversationId = req.params.id;
  const { stage } = req.body;

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { contact: true },
  });

  if (!convo) return res.status(404).json({ error: 'Conversation not found' });

  await prisma.contact.update({
    where: { id: convo.contactId },
    data: { stage },
  });

  return res.json({ ok: true });
});

// Get unread counts for all conversations
inboxRouter.get('/unread-counts', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const result = await prisma.contact.aggregate({
    where: { workspaceId },
    _sum: {
      unreadCount: true,
    },
  });

  return res.json({
    ok: true,
    totalUnread: result._sum.unreadCount || 0,
  });
});

export default inboxRouter;
