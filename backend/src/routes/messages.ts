import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendWhatsAppText } from '../whatsapp/meta';
import { publish } from '../realtime/events';

export const messagesRouter = Router();

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

messagesRouter.use(extractAuth);

const SendSchema = z.object({
  conversationId: z.string(),
  text: z.string().min(1),
});

messagesRouter.post('/send', async (req, res) => {
  const userId = (req as any).userId;
  const workspaceId = (req as any).workspaceId;

  const parsed = SendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { conversationId, text } = parsed.data;

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { contact: true },
  });

  if (!convo) return res.status(404).json({ error: 'Conversation not found' });

  const wa = await prisma.waAccount.findUnique({
    where: { workspaceId },
  });

  if (!wa) {
    return res.status(400).json({
      error: 'WhatsApp not connected',
      message: 'Missing waAccount for workspace',
    });
  }

  // 1) Send via Meta
  let sent;
  try {
    sent = await sendWhatsAppText({
      accessToken: wa.accessToken,
      phoneNumberId: wa.phoneNumberId,
      to: convo.contact.phone,
      text,
    });
  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to send message',
      details: error.response?.data || error.message,
    });
  }

  // 2) Store outbound message
  const message = await prisma.message.create({
    data: {
      workspaceId,
      conversationId,
      contactId: convo.contactId,
      direction: 'outbound',
      type: 'text',
      bodyText: text,
      waMessageId: sent?.messages?.[0]?.id || null,
      sentByUserId: userId,
    },
  });

  // 3) Publish real-time event
  publish(workspaceId, {
    type: 'outbound_message',
    conversationId,
    message: {
      id: message.id,
      direction: 'outbound',
      bodyText: text,
      type: 'text',
      createdAt: message.createdAt,
      sentByUserId: userId,
    },
  });

  return res.json({ ok: true, sent });
});

export default messagesRouter;
