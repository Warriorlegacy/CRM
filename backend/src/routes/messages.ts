import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendWhatsAppText } from '../whatsapp/meta';
import { sendInstagramMessage } from '../instagram/graph';
import { publish } from '../realtime/events';
import { createNotification } from './notifications';

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
      if (!wa.accessToken || wa.accessToken.includes('placeholder')) {
        return res.status(400).json({
          error: 'Meta Access Token missing. Please click Reconnect on Setup page or enter your Meta Access Token in Settings -> WhatsApp.',
        });
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
    const metaErrObj = error.response?.data?.error;
    const metaError = metaErrObj?.message || error.response?.data?.message || error.message;
    const errorCode = metaErrObj?.code;

    let errorMsg = `Meta API Error: ${metaError}`;
    if (errorCode === 133010 || (typeof metaError === 'string' && metaError.includes('133010'))) {
      errorMsg = 'WhatsApp Error (#133010): Account not registered. Your WhatsApp Phone Number ID is not fully registered/activated in Meta WhatsApp Manager, or two-step verification is blocking API registration.';
    } else if (errorCode === 131030 || (typeof metaError === 'string' && metaError.includes('131030'))) {
      errorMsg = 'WhatsApp Error (#131030): Recipient number is not added to your Meta Developer Portal test number list.';
    } else if (errorCode === 131047 || (typeof metaError === 'string' && metaError.includes('131047'))) {
      errorMsg = 'WhatsApp Error (#131047): 24-hour session window expired. Send a WhatsApp Template message to re-engage.';
    } else if (typeof metaError === 'string' && metaError.includes('appsecret_proof')) {
      errorMsg = 'Meta API Error: appsecret_proof is required by Meta. Please set META_APP_SECRET in your backend environment variables or disable "Require App Secret" in Meta App Dashboard (Settings -> Advanced).';
    }

    return res.status(400).json({
      error: errorMsg,
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

  // 4) Create notification for sent message
  try {
    const contactName = convo.contact.name || (channel === 'instagram' ? convo.contact.igUsername : convo.contact.phone) || 'Contact';
    await createNotification(workspaceId, {
      type: 'outbound_message',
      title: `Message sent to ${contactName}`,
      message: (text || '📎 Media').substring(0, 120),
      channel,
      link: '/inbox',
    });
  } catch (e) {
    console.error('Failed to create notification for outbound message:', e);
  }

  return res.json({ ok: true, sent });
});

export default messagesRouter;
