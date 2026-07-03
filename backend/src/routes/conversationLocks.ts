import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { unlockConversation } from '../middleware/agentCollision';

export const conversationLocksRouter = Router();

conversationLocksRouter.use(requireAuth);

conversationLocksRouter.post('/:id/lock', async (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const { userId, workspaceId } = req as any;

  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 12_000);

    const conversation = await (tx as any).conversation.findFirst({
      where: { id: conversationId, workspaceId },
      select: { lockedByUserId: true, lockedAt: true },
    });

    if (!conversation) {
      return { acquired: false as const, reason: 'Conversation not found', notFound: true };
    }

    const isStale = conversation.lockedAt
      ? new Date(conversation.lockedAt).getTime() < staleThreshold.getTime()
      : false;

    if (conversation.lockedByUserId && conversation.lockedByUserId !== userId && !isStale) {
      const locker = await (tx as any).user.findUnique({
        where: { id: conversation.lockedByUserId },
        select: { id: true, name: true },
      });

      return {
        acquired: false as const,
        reason: 'locked',
        lockedByUserId: conversation.lockedByUserId,
        lockedByName: locker?.name || null,
      };
    }

    await (tx as any).conversation.update({
      where: { id: conversationId },
      data: {
        lockedByUserId: userId,
        lockedAt: now,
      },
    });

    return { acquired: true as const };
  });

  if (result.notFound) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  if (!result.acquired) {
    return res.status(409).json({
      error: 'Conversation locked',
      message: `This conversation is currently being handled by ${result.lockedByName || 'another agent'}.`,
      lockedByUserId: result.lockedByUserId,
      lockedByName: result.lockedByName,
    });
  }

  return res.json({ ok: true, locked: true });
});

conversationLocksRouter.delete('/:id/lock', unlockConversation, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

conversationLocksRouter.get('/:id/lock', async (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const workspaceId = (req as any).workspaceId;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    select: { lockedByUserId: true, lockedAt: true },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const isStale = conversation.lockedAt
    ? new Date().getTime() - new Date(conversation.lockedAt).getTime() > 12_000
    : false;

  const isLocked = !!(conversation.lockedByUserId && !isStale);

  let lockedByName: string | null = null;
  if (isLocked && conversation.lockedByUserId) {
    const user = await prisma.user.findUnique({
      where: { id: conversation.lockedByUserId },
      select: { name: true },
    });
    lockedByName = user?.name || null;
  }

  res.json({
    ok: true,
    locked: isLocked,
    lockedByUserId: conversation.lockedByUserId,
    lockedByName,
    lockedAt: conversation.lockedAt,
  });
});

export default conversationLocksRouter;
