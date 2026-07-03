import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { trackActivity } from '../services/activityTracker';

const LOCK_TIMEOUT_MS = 12_000;

export interface AuthedRequest extends Request {
  userId: string;
  workspaceId: string;
}

export function lockConversation(req: Request, res: Response, next: NextFunction): void {
  const authedReq = req as AuthedRequest;
  const conversationId = req.params.id;

  if (!conversationId || !authedReq.userId || !authedReq.workspaceId) {
    res.status(400).json({ error: 'Missing conversation ID or auth context' });
    return;
  }

  const now = new Date();
  const staleThreshold = new Date(now.getTime() - LOCK_TIMEOUT_MS);

  prisma.$transaction(async (tx) => {
    const updated = await (tx as any).conversation.updateMany({
      where: {
        id: conversationId,
        workspaceId: authedReq.workspaceId,
        OR: [
          { lockedAt: null },
          { lockedAt: { lt: staleThreshold } },
        ],
      },
      data: {
        lockedByUserId: authedReq.userId,
        lockedAt: now,
      },
    });

    if (updated.count === 0) {
      const conversation = await (tx as any).conversation.findFirst({
        where: { id: conversationId, workspaceId: authedReq.workspaceId },
        select: { lockedByUserId: true },
      });

      if (conversation?.lockedByUserId && conversation.lockedByUserId !== authedReq.userId) {
        const locker = await (tx as any).user.findUnique({
          where: { id: conversation.lockedByUserId },
          select: { id: true, name: true },
        });

        res.status(409).json({
          error: 'Conversation locked',
          message: `This conversation is currently being handled by ${locker?.name || 'another agent'}.`,
          lockedByUserId: conversation.lockedByUserId,
          lockedByName: locker?.name || null,
        });
        return;
      }

      next();
      return;
    }

    next();
  });
}

export async function unlockConversation(req: Request, res: Response): Promise<void> {
  const authedReq = req as AuthedRequest;
  const conversationId = req.params.id;

  if (!conversationId || !authedReq.userId) {
    return;
  }

  await (prisma.conversation.updateMany as any)({
    where: {
      id: conversationId,
      lockedByUserId: authedReq.userId,
    },
    data: {
      lockedByUserId: null,
      lockedAt: null,
    },
  });
}
