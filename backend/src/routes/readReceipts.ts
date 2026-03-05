import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { publish } from '../realtime/events';

export const readReceiptRouter = Router();

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

readReceiptRouter.use(extractAuth);

// Mark messages as read
readReceiptRouter.post('/', async (req, res) => {
  const userId = (req as any).userId;
  const workspaceId = (req as any).workspaceId;
  const { conversationId } = req.body;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { contact: true },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Get all unread messages in this conversation
  const unreadMessages = await prisma.message.findMany({
    where: {
      conversationId,
      workspaceId,
      direction: 'inbound',
      NOT: {
        readReceipts: {
          some: {
            userId,
          },
        },
      },
    },
  });

  // Create read receipts for all unread messages
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

  // Update lastReadAt on conversation
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastReadAt: new Date() },
  });

  // Reset unread count for contact
  await prisma.contact.update({
    where: { id: conversation.contactId },
    data: { unreadCount: 0 },
  });

  // Publish real-time event
  publish(workspaceId, {
    type: 'messages_read',
    conversationId,
    userId,
    messageIds: unreadMessages.map((m) => m.id),
  });

  return res.json({
    ok: true,
    markedAsRead: unreadMessages.length,
  });
});

// Get read receipts for messages
readReceiptRouter.get('/:conversationId', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { conversationId } = req.params;

  const readReceipts = await prisma.readReceipt.findMany({
    where: {
      message: {
        conversationId,
        workspaceId,
      },
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
      message: {
        select: { id: true },
      },
    },
  });

  const groupedByMessage = readReceipts.reduce((acc: any, receipt) => {
    if (!acc[receipt.message.id]) {
      acc[receipt.message.id] = [];
    }
    acc[receipt.message.id].push({
      userId: receipt.userId,
      userName: receipt.user.name,
      readAt: receipt.readAt,
    });
    return acc;
  }, {});

  return res.json({
    ok: true,
    readReceipts: groupedByMessage,
  });
});

export default readReceiptRouter;
