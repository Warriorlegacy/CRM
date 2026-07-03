import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Contact } from '@prisma/client';
import { prisma } from '../prisma';
import { sendWhatsAppText } from '../whatsapp/meta';
import { publish } from '../realtime/events';
import { AuthedRequest } from '../middleware/auth';

export const broadcastsRouter = Router();

const CreateBroadcastSchema = z.object({
  name: z.string().min(1, 'Broadcast name is required'),
  message: z.string().min(1, 'Message is required').max(4096),
  recipientFilter: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

const SendBroadcastSchema = z.object({
  contactIds: z.array(z.string()).optional(),
});

// GET /api/v1/broadcasts - List all broadcasts with pagination
broadcastsRouter.get('/', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { page = '1', limit = '20', status } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { workspaceId };
  if (status) {
    where.status = status;
  }

  const [broadcasts, total] = await Promise.all([
    prisma.broadcast.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.broadcast.count({ where }),
  ]);

  return res.json({
    ok: true,
    broadcasts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// POST /api/v1/broadcasts - Create a broadcast
broadcastsRouter.post('/', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const parsed = CreateBroadcastSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { name, message, recipientFilter, scheduledAt } = parsed.data;

  const broadcast = await prisma.broadcast.create({
    data: {
      workspaceId,
      name,
      message,
      recipientFilter: recipientFilter || null,
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return res.status(201).json({ ok: true, broadcast });
});

// GET /api/v1/broadcasts/:id - Get broadcast details with delivery stats
broadcastsRouter.get('/:id', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const broadcast = await prisma.broadcast.findFirst({
    where: { id, workspaceId },
    include: {
      messages: {
        include: {
          contact: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!broadcast) {
    return res.status(404).json({ error: 'Broadcast not found' });
  }

  return res.json({ ok: true, broadcast });
});

// GET /api/v1/broadcasts/:id/messages - Get individual message statuses
broadcastsRouter.get('/:id/messages', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;
  const { status, page = '1', limit = '50' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const broadcast = await prisma.broadcast.findFirst({
    where: { id, workspaceId },
  });

  if (!broadcast) {
    return res.status(404).json({ error: 'Broadcast not found' });
  }

  const where: Record<string, unknown> = { broadcastId: id };
  if (status) {
    where.status = status;
  }

  const [messages, total] = await Promise.all([
    prisma.broadcastMessage.findMany({
      where,
      include: {
        contact: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.broadcastMessage.count({ where }),
  ]);

  return res.json({
    ok: true,
    messages,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// POST /api/v1/broadcasts/:id/send - Execute/send a broadcast
broadcastsRouter.post('/:id/send', async (req: Request, res: Response) => {
  const { workspaceId, userId } = req as unknown as AuthedRequest;
  const { id } = req.params;
  const parsed = SendBroadcastSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const broadcast = await prisma.broadcast.findFirst({
    where: { id, workspaceId },
  });

  if (!broadcast) {
    return res.status(404).json({ error: 'Broadcast not found' });
  }

  if (broadcast.status === 'sent' || broadcast.status === 'sending') {
    return res.status(400).json({ error: 'Broadcast already sent or currently sending' });
  }

  const wa = await prisma.waAccount.findUnique({ where: { workspaceId } });
  if (!wa) {
    return res.status(400).json({ error: 'WhatsApp not connected' });
  }

  // Determine recipients based on filter or explicit IDs
  let contacts: Contact[];
  if (parsed.data.contactIds && parsed.data.contactIds.length > 0) {
    contacts = await prisma.contact.findMany({
      where: { id: { in: parsed.data.contactIds }, workspaceId },
    });
  } else if (broadcast.recipientFilter) {
    const filter = JSON.parse(broadcast.recipientFilter);
    const whereClause: Record<string, unknown> = { workspaceId };

    if (filter.stage) {
      whereClause.stage = filter.stage;
    }
    if (filter.tags) {
      whereClause.tags = { contains: filter.tags };
    }
    if (filter.contactIds && filter.contactIds.length > 0) {
      whereClause.id = { in: filter.contactIds };
    }

    contacts = await prisma.contact.findMany({ where: whereClause });
  } else {
    return res.status(400).json({ error: 'No recipients specified' });
  }

  if (contacts.length === 0) {
    return res.status(400).json({ error: 'No contacts found matching the filter' });
  }

  // Update broadcast status to sending
  await prisma.broadcast.update({
    where: { id },
    data: {
      status: 'sending',
      totalRecipients: contacts.length,
    },
  });

  // Create pending BroadcastMessage records for all contacts
  const broadcastMessages = await Promise.all(
    contacts.map((contact) =>
      prisma.broadcastMessage.create({
        data: {
          broadcastId: id,
          contactId: contact.id,
          status: 'pending',
        },
      })
    )
  );

  // Send messages asynchronously (fire-and-forget for now)
  const sendBroadcast = async () => {
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const bm = broadcastMessages[i];

      try {
        // Replace template variables
        let personalizedMessage = broadcast.message
          .replace(/\{\{name\}\}/g, contact.name || 'there')
          .replace(/\{\{phone\}\}/g, contact.phone)
          .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());

        const sent = await sendWhatsAppText({
          accessToken: wa.accessToken,
          phoneNumberId: wa.phoneNumberId,
          to: contact.phone,
          text: personalizedMessage,
        });

        const waMessageId = sent?.messages?.[0]?.id || null;

        // Update broadcast message status
        await prisma.broadcastMessage.update({
          where: { id: bm.id },
          data: {
            status: 'sent',
            waMessageId,
            sentAt: new Date(),
          },
        });

        // Also create a regular message in the conversation
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
            bodyText: personalizedMessage,
            waMessageId,
            sentByUserId: userId,
          },
        });

        sentCount++;

        // Publish real-time event
        publish(workspaceId, {
          type: 'broadcast_message_sent',
          broadcastId: id,
          contactId: contact.id,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        failedCount++;
        await prisma.broadcastMessage.update({
          where: { id: bm.id },
          data: {
            status: 'failed',
            error: message,
          },
        });
      }
    }

    // Update broadcast final status
    await prisma.broadcast.update({
      where: { id },
      data: {
        status: failedCount === contacts.length ? 'failed' : 'sent',
        sentAt: new Date(),
        sentCount,
        failedCount,
      },
    });

    // Publish completion event
    publish(workspaceId, {
      type: 'broadcast_completed',
      broadcastId: id,
      sentCount,
      failedCount,
      total: contacts.length,
    });
  };

  // Execute broadcast in background
  sendBroadcast().catch((err) => {
    console.error('Broadcast execution error:', err);
    prisma.broadcast.update({
      where: { id },
      data: { status: 'failed' },
    }).catch(() => {});
  });

  return res.json({
    ok: true,
    message: 'Broadcast sending started',
    totalRecipients: contacts.length,
  });
});

// DELETE /api/v1/broadcasts/:id - Delete a broadcast
broadcastsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const broadcast = await prisma.broadcast.findFirst({
    where: { id, workspaceId },
  });

  if (!broadcast) {
    return res.status(404).json({ error: 'Broadcast not found' });
  }

  if (broadcast.status === 'sending') {
    return res.status(400).json({ error: 'Cannot delete a broadcast that is currently sending' });
  }

  // Delete related messages first
  await prisma.broadcastMessage.deleteMany({ where: { broadcastId: id } });
  await prisma.broadcast.delete({ where: { id } });

  return res.status(204).send();
});

export default broadcastsRouter;
