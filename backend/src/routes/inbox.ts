import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../middleware/auth';

export const inboxRouter = Router();

inboxRouter.get('/conversations', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined;

  const conversations = await prisma.conversation.findMany({
    where: {
      workspaceId,
      ...(status ? { status } : {}),
      ...(channel && channel !== 'all' ? { channel } : {}),
    },
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

  const data = conversations.map((conversation) => ({
    id: conversation.id,
    contactId: conversation.contactId,
    name: conversation.contact.name,
    phone: conversation.contact.phone,
    stage: conversation.contact.stage,
    channel: conversation.channel,
    assignedToId: conversation.contact.assignedToId,
    assignedTo: conversation.contact.assignedTo,
    unreadCount: conversation.contact.unreadCount,
    lastMessage: conversation.messages[0]?.bodyText || '',
    lastMessageAt: conversation.messages[0]?.createdAt || null,
    status: conversation.status,
  }));

  return res.json({
    success: true,
    data: { conversations: data },
    conversations: data,
  });
});

inboxRouter.get('/conversations/:id/messages', async (req, res) => {
  const { userId, workspaceId } = req as unknown as AuthedRequest;
  const conversationId = req.params.id;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const cursor = req.query.cursor as string | undefined;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const where: Record<string, unknown> = { conversationId, workspaceId };
  if (cursor) {
    where.createdAt = { gt: new Date(parseInt(cursor)) };
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: limit + 1,
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

  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.getTime().toString() : null;

  const unreadMessages = data.filter(
    (message) => message.direction === 'inbound' && !message.readReceipts.some((receipt) => receipt.userId === userId)
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

    await prisma.contact.update({
      where: { id: conversation.contactId },
      data: { unreadCount: 0 },
    });
  }

  return res.json({
    success: true,
    data: { messages: data, nextCursor, hasMore },
    messages: data,
    nextCursor,
    hasMore,
  });
});

inboxRouter.patch('/conversations/:id/assign', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const conversationId = req.params.id;
  const { assignedToId } = req.body;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { contact: true },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  await prisma.contact.update({
    where: { id: conversation.contactId },
    data: { assignedToId },
  });

  return res.json({ success: true });
});

inboxRouter.patch('/conversations/:id/stage', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const conversationId = req.params.id;
  const { stage } = req.body;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { contact: true },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  await prisma.contact.update({
    where: { id: conversation.contactId },
    data: { stage },
  });

  return res.json({ success: true });
});

inboxRouter.get('/unread-counts', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const result = await prisma.contact.aggregate({
    where: { workspaceId },
    _sum: {
      unreadCount: true,
    },
  });

  const totalUnread = result._sum.unreadCount || 0;

  return res.json({
    success: true,
    data: { totalUnread },
    totalUnread,
  });
});

export default inboxRouter;
