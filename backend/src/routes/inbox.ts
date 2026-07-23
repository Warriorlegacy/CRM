import { Router } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../middleware/auth';
import { lockConversation, unlockConversation } from '../middleware/agentCollision';
import { trackActivity } from '../services/activityTracker';
import { publish } from '../realtime/events';

export const inboxRouter = Router();

inboxRouter.get('/conversations', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined;
  const tagId = typeof req.query.tag === 'string' ? req.query.tag : undefined;

  // Use `as any` casts here: `tagAssignments` + result shape depend on
  // the ConversationTag models being defined in the Prisma schema.
  // Once `npx prisma generate` is re-run, these casts can be removed.
  const xprisma = prisma as any;
  const conversations = await xprisma.conversation.findMany({
    where: {
      workspaceId,
      ...(status ? { status } : {}),
      ...(channel && channel !== 'all' ? { channel } : {}),
      ...(tagId ? { tagAssignments: { some: { tagId } } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      tagAssignments: {
        include: { tag: { select: { id: true, name: true, color: true } } },
      },
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

  const data = (conversations || []).map((conversation: any) => ({
    id: conversation.id,
    contactId: conversation.contactId,
    name: conversation.contact?.name,
    phone: conversation.contact?.phone,
    stage: conversation.contact?.stage,
    channel: conversation.channel,
    assignedToId: conversation.contact?.assignedToId,
    assignedTo: conversation.contact?.assignedTo,
    unreadCount: conversation.contact?.unreadCount ?? 0,
    lastMessage: conversation.messages?.[0]?.bodyText || '',
    lastMessageAt: conversation.messages?.[0]?.createdAt || null,
    status: conversation.status,
    tags: (conversation.tagAssignments || []).map((a: any) => ({
      id: a.tag?.id,
      name: a.tag?.name,
      color: a.tag?.color,
    })),
    lockedByUserId: conversation.lockedByUserId,
    lockedAt: conversation.lockedAt,
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

  await trackActivity(workspaceId, userId, 'viewing', conversationId);

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

inboxRouter.get('/conversations/:id/notes', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id: conversationId } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const notes = await prisma.conversationNote.findMany({
    where: { conversationId, workspaceId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return res.json({
    notes: notes.map((n) => ({
      id: n.id,
      conversationId: n.conversationId,
      userId: n.userId,
      userName: n.user?.name || null,
      content: n.content,
      priority: n.priority,
      mentions: n.mentions,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
  });
});

inboxRouter.patch('/conversations/:id/assign', lockConversation, async (req, res) => {
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

inboxRouter.patch('/conversations/:id/stage', lockConversation, async (req, res) => {
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

// ── Agent Collision Lock Routes ─────────────────────────────────────────
inboxRouter.post('/conversations/:id/lock', lockConversation, (req, res) => {
  return res.json({ ok: true, locked: true });
});

inboxRouter.delete('/conversations/:id/lock', async (req, res) => {
  await unlockConversation(req, res);
  return res.json({ ok: true, locked: false });
});

inboxRouter.get('/conversations/:id/lock', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const conversationId = req.params.id;

  const conversation = await (prisma as any).conversation.findFirst({
    where: { id: conversationId, workspaceId },
    select: { lockedByUserId: true, lockedAt: true },
  });

  if (!conversation) return res.status(404).json({ error: 'Not found' });

  let lockedByName = null;
  if (conversation.lockedByUserId) {
    const locker = await prisma.user.findUnique({
      where: { id: conversation.lockedByUserId },
      select: { name: true },
    });
    lockedByName = locker?.name || null;
  }

  return res.json({
    ok: true,
    locked: !!conversation.lockedByUserId,
    lockedByUserId: conversation.lockedByUserId,
    lockedByName,
    lockedAt: conversation.lockedAt,
  });
});

export default inboxRouter;
