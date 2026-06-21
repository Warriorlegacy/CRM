import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendWhatsAppText } from '../whatsapp/meta';
import { publish } from '../realtime/events';

export const broadcastRouter = Router();

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

broadcastRouter.use(extractAuth);

const BroadcastSchema = z.object({
  contactIds: z.array(z.string()).min(1, 'At least one contact is required'),
  message: z.string().min(1, 'Message is required').max(4096),
  templateId: z.string().optional(),
});

broadcastRouter.post('/send', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const userId = (req as any).userId;

  const parsed = BroadcastSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: parsed.error.flatten() 
    });
  }

  const { contactIds, message, templateId } = parsed.data;

  const wa = await prisma.waAccount.findUnique({
    where: { workspaceId },
  });

  if (!wa) {
    return res.status(400).json({
      error: 'WhatsApp not connected',
      message: 'Please configure WhatsApp in settings first',
    });
  }

  const contacts = await prisma.contact.findMany({
    where: { 
      id: { in: contactIds },
      workspaceId,
    },
  });

  if (contacts.length === 0) {
    return res.status(400).json({
      error: 'No valid contacts found',
    });
  }

  const results = {
    total: contacts.length,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const contact of contacts) {
    try {
      const sent = await sendWhatsAppText({
        accessToken: wa.accessToken,
        phoneNumberId: wa.phoneNumberId,
        to: contact.phone,
        text: message,
      });

      const conversation = await prisma.conversation.upsert({
        where: {
          workspaceId_contactId: {
            workspaceId,
            contactId: contact.id,
          },
        },
        update: { status: 'open' },
        create: {
          workspaceId,
          contactId: contact.id,
          status: 'open',
        },
      });

      await prisma.message.create({
        data: {
          workspaceId,
          conversationId: conversation.id,
          contactId: contact.id,
          direction: 'outbound',
          type: 'text',
          bodyText: message,
          waMessageId: sent?.messages?.[0]?.id || null,
          sentByUserId: userId,
        },
      });

      results.sent++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`${contact.phone}: ${error.message}`);
    }
  }

  return res.json({ 
    ok: true, 
    results,
    message: `Sent ${results.sent} of ${results.total} messages`,
  });
});

broadcastRouter.post('/send-to-stage', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const userId = (req as any).userId;
  const { stage, message } = req.body;

  if (!stage || !message) {
    return res.status(400).json({
      error: 'Stage and message are required',
    });
  }

  const wa = await prisma.waAccount.findUnique({
    where: { workspaceId },
  });

  if (!wa) {
    return res.status(400).json({
      error: 'WhatsApp not connected',
      message: 'Please configure WhatsApp in settings first',
    });
  }

  const contacts = await prisma.contact.findMany({
    where: { workspaceId, stage },
  });

  if (contacts.length === 0) {
    return res.status(400).json({
      error: 'No contacts found in this stage',
    });
  }

  const results = {
    total: contacts.length,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const contact of contacts) {
    try {
      const sent = await sendWhatsAppText({
        accessToken: wa.accessToken,
        phoneNumberId: wa.phoneNumberId,
        to: contact.phone,
        text: message,
      });

      const conversation = await prisma.conversation.upsert({
        where: {
          workspaceId_contactId: {
            workspaceId,
            contactId: contact.id,
          },
        },
        update: { status: 'open' },
        create: {
          workspaceId,
          contactId: contact.id,
          status: 'open',
        },
      });

      await prisma.message.create({
        data: {
          workspaceId,
          conversationId: conversation.id,
          contactId: contact.id,
          direction: 'outbound',
          type: 'text',
          bodyText: message,
          waMessageId: sent?.messages?.[0]?.id || null,
          sentByUserId: userId,
        },
      });

      results.sent++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`${contact.phone}: ${error.message}`);
    }
  }

  return res.json({ 
    ok: true, 
    results,
    message: `Sent ${results.sent} of ${results.total} messages`,
  });
});

broadcastRouter.get('/history', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { limit = '50' } = req.query;

  const broadcasts = await prisma.message.findMany({
    where: {
      workspaceId,
      direction: 'outbound',
      sentByUserId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
    include: {
      contact: {
        select: { name: true, phone: true },
      },
    },
  });

  return res.json({ ok: true, broadcasts });
});

export default broadcastRouter;
