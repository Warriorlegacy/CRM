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

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const messages = await prisma.message.findMany({
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

  const unreadMessages = messages.filter(
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
    data: { messages },
    messages,
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
