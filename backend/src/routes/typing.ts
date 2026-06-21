import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { publish } from '../realtime/events';

export const typingRouter = Router();

// Set typing status
typingRouter.post('/', async (req, res) => {
  const userId = (req as any).userId;
  const workspaceId = (req as any).workspaceId;
  const { conversationId, status } = req.body;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Update or create typing indicator
  await prisma.typingIndicator.upsert({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    update: {
      status,
      updatedAt: new Date(),
    },
    create: {
      conversationId,
      userId,
      workspaceId,
      status,
    },
  });

  // Get user info for the event
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  // Publish real-time event
  publish(workspaceId, {
    type: 'typing_status',
    conversationId,
    userId,
    userName: user?.name,
    status,
  });

  return res.json({ ok: true });
});

// Get typing users for a conversation
typingRouter.get('/:conversationId', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { conversationId } = req.params;

  const fiveSecondsAgo = new Date(Date.now() - 5000);

  const typingUsers = await prisma.typingIndicator.findMany({
    where: {
      conversationId,
      workspaceId,
      status: 'typing',
      updatedAt: {
        gte: fiveSecondsAgo,
      },
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  return res.json({
    ok: true,
    typingUsers: typingUsers.map((t) => ({
      userId: t.userId,
      userName: t.user.name,
    })),
  });
});

export default typingRouter;
