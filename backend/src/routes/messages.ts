import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendWhatsAppText } from '../whatsapp/meta';
import { sendInstagramMessage } from '../instagram/graph';
import { publish } from '../realtime/events';

export const messagesRouter = Router();

const SendSchema = z.object({
  conversationId: z.string(),
  text: z.string().optional().default(''),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  mediaType: z.enum(['image', 'document', 'audio', 'sticker', 'voice']).optional(),
  mediaMimeType: z.string().optional(),
}).refine(
  (data) => data.text?.trim() || (data.mediaUrl && data.mediaUrl.trim()),
  { message: 'Either text or media is required', path: ['text'] }
);

messagesRouter.post('/send', async (req, res) => {
  const userId = (req as any).userId;
  const workspaceId = (req as any).workspaceId;

  const parsed = SendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { conversationId, text, mediaUrl, mediaType, mediaMimeType } = parsed.data;

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { contact: true },
  });

  if (!convo) return res.status(404).json({ error: 'Conversation not found' });

  const channel = convo.channel || 'whatsapp';

  // 1) Send via appropriate channel
  let sent: any = null;
  let platformMessageId: string | null = null;

  try {
    if (channel === 'instagram') {
      const ig = await prisma.igAccount.findUnique({ where: { workspaceId } });
      if (!ig) {
        return res.status(400).json({ error: 'Instagram not connected' });
      }
      sent = await sendInstagramMessage({
        accessToken: ig.accessToken,
        igUserId: ig.igUserId,
        recipientId: convo.contact.igUsername || convo.contact.phone.replace('ig_', ''),
        text,
      });
      platformMessageId = sent?.message_id || null;
    } else {
      const wa = await prisma.waAccount.findUnique({ where: { workspaceId } });
      if (!wa) {
        return res.status(400).json({ error: 'WhatsApp not connected' });
      }
      sent = await sendWhatsAppText({
        accessToken: wa.accessToken,
        phoneNumberId: wa.phoneNumberId,
        to: convo.contact.phone,
        text,
      });
      platformMessageId = sent?.messages?.[0]?.id || null;
    }
  } catch (error: any) {
    console.error(`Failed to send ${channel} message:`, error.response?.data || error.message);
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
      channel,
      direction: 'outbound',
      type: mediaUrl ? (mediaType || 'document') : 'text',
      bodyText: text || null,
      waMessageId: channel === 'whatsapp' ? platformMessageId : null,
      igMessageId: channel === 'instagram' ? platformMessageId : null,
      sentByUserId: userId,
      ...(mediaUrl ? {
        mediaUrl,
        mediaType: mediaType || 'document',
        mediaMimeType: mediaMimeType || null,
      } : {}),
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
      type: message.type,
      createdAt: message.createdAt,
      sentByUserId: userId,
      ...(mediaUrl ? {
        mediaUrl,
        mediaType: mediaType || 'document',
        mediaMimeType: mediaMimeType || null,
      } : {}),
    },
  });

  return res.json({ ok: true, sent });
});

export default messagesRouter;
