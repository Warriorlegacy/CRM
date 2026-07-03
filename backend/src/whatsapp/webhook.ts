import { prisma } from '../prisma';
import { publish } from '../realtime/events';
import { sendWhatsAppText } from './meta';
import { processChatbotMessage } from '../services/chatbotEngine';
import { processLeadScore } from '../services/leadScoring';
import { processAutomation } from '../services/aiAutomation';

function getInboundMessage(payload: any) {
  const entry = payload?.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  const metadata = value?.metadata;
  const messages = value?.messages?.[0];

  if (!messages) return null;

  const from = messages.from;
  const waMessageId = messages.id;
  const type = messages.type;

  let bodyText: string | null = null;
  let mediaUrl: string | null = null;
  let mediaMimeType: string | null = null;

  if (type === 'text') {
    bodyText = messages.text?.body || null;
  } else if (['image', 'document', 'audio', 'sticker', 'voice'].includes(type)) {
    const media = messages[type];
    if (media) {
      mediaUrl = media.id || null;
      mediaMimeType = media.mime_type || null;
      if (type === 'image') bodyText = media.caption || null;
      if (type === 'document') bodyText = media.caption || null;
    }
  }

  return {
    phoneNumberId: metadata?.phone_number_id as string,
    from,
    waMessageId,
    type,
    bodyText,
    mediaUrl,
    mediaMimeType,
    raw: payload,
  };
}

async function findWorkspaceByPhoneNumberId(phoneNumberId: string) {
  const wa = await prisma.waAccount.findFirst({
    where: { phoneNumberId },
    include: { workspace: true },
  });
  return wa?.workspace || null;
}

export async function handleWhatsAppWebhook(payload: any) {
  const inbound = getInboundMessage(payload);
  if (!inbound) return { ok: true, ignored: true };

  const workspace = await findWorkspaceByPhoneNumberId(inbound.phoneNumberId);
  if (!workspace) {
    return { ok: false, error: 'Workspace not found for phoneNumberId' };
  }

  // 1) Create or find contact
  const contact = await prisma.contact.upsert({
    where: {
      workspaceId_phone: {
        workspaceId: workspace.id,
        phone: inbound.from,
      },
    },
    update: {
      lastMessageAt: new Date(),
      unreadCount: {
        increment: 1,
      },
    },
    create: {
      workspaceId: workspace.id,
      phone: inbound.from,
      name: null,
      stage: 'new',
      tags: '',
      lastMessageAt: new Date(),
      unreadCount: 1,
    },
  });

  // 2) Create or find conversation
  const conversation = await prisma.conversation.upsert({
    where: {
      workspaceId_contactId: {
        workspaceId: workspace.id,
        contactId: contact.id,
      },
    },
    update: {
      status: 'open',
    },
    create: {
      workspaceId: workspace.id,
      contactId: contact.id,
      status: 'open',
    },
  });

  // 3) Store inbound message
  const message = await prisma.message.create({
    data: {
      workspaceId: workspace.id,
      conversationId: conversation.id,
      contactId: contact.id,
      direction: 'inbound',
      type: inbound.type === 'text'
        ? 'text'
        : ['image', 'document', 'audio', 'sticker', 'voice'].includes(inbound.type)
        ? inbound.type
        : 'text',
      bodyText: inbound.bodyText,
      waMessageId: inbound.waMessageId,
      sentByUserId: null,
      ...(inbound.mediaUrl ? {
        mediaUrl: inbound.mediaUrl,
        mediaType: inbound.type === 'text' ? null : inbound.type,
        mediaMimeType: inbound.mediaMimeType,
      } : {}),
    },
  });

  // 4) Publish real-time event
  publish(workspace.id, {
    type: 'inbound_message',
    conversationId: conversation.id,
    contactId: contact.id,
    message: {
      id: message.id,
      direction: 'inbound',
      bodyText: inbound.bodyText,
      type: message.type,
      createdAt: message.createdAt,
      ...(message.mediaUrl ? {
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        mediaMimeType: message.mediaMimeType,
      } : {}),
    },
    unreadCount: contact.unreadCount,
  });

  // 5) Process autoresponders
  await processAutoresponders(
    workspace.id,
    contact.id,
    conversation.id,
    inbound.bodyText,
    workspace.businessHoursEnabled,
    workspace.businessHoursJson
  );

  // 6) Process chatbot flows
  await processChatbotMessage({
    workspaceId: workspace.id,
    contactId: contact.id,
    conversationId: conversation.id,
    channel: 'whatsapp',
    messageText: inbound.bodyText,
    senderId: inbound.from,
  });

  // 7) Lead scoring for inbound message
  await processLeadScore({
    workspaceId: workspace.id,
    contactId: contact.id,
    event: 'inbound_message',
  });

  // 8) AI Automation - analyze, categorize, auto-reply
  await processAutomation({
    workspaceId: workspace.id,
    contactId: contact.id,
    conversationId: conversation.id,
    channel: 'whatsapp',
    messageText: inbound.bodyText || '',
    contactName: contact.name || 'Customer',
  });

  return {
    ok: true,
    workspaceId: workspace.id,
    contactId: contact.id,
    conversationId: conversation.id,
  };
}

async function processAutoresponders(
  workspaceId: string,
  contactId: string,
  conversationId: string,
  messageText: string | null,
  businessHoursEnabled: boolean = false,
  businessHoursJson: string | null = null
) {
  try {
    const autoresponders = await prisma.autoresponder.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
    });

    for (const responder of autoresponders) {
      let shouldTrigger = false;
      let messageToSend = responder.message;

      if (responder.trigger === 'away_message') {
        if (!businessHoursEnabled || !businessHoursJson) continue;
        const config = JSON.parse(businessHoursJson);
        const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
          new Date().getDay()
        ];
        const range = config[dayKey];
        if (!range || !Array.isArray(range) || range.length !== 2) continue;
        const [startStr, endStr] = range;
        const start = parseInt(startStr.split(':')[0]) * 60 + parseInt(startStr.split(':')[1]);
        const end = parseInt(endStr.split(':')[0]) * 60 + parseInt(endStr.split(':')[1]);
        const now = new Date();
        const current = now.getHours() * 60 + now.getMinutes();
        const outside = end > start
          ? (current < start || current >= end)
          : (current < start && current >= end);
        if (!outside) continue;

        const highestPriority = await prisma.awayMessage.findFirst({
          where: { workspaceId, isActive: true },
          orderBy: { priority: 'desc' },
        });
        if (highestPriority) {
          messageToSend = highestPriority.message;
        } else {
          continue;
        }
        shouldTrigger = true;
      } else if (responder.trigger === 'keyword' && responder.keyword) {
        shouldTrigger = messageText?.toLowerCase().includes(responder.keyword.toLowerCase()) || false;
      } else if (responder.trigger === 'new_contact') {
        const existingMessages = await prisma.message.count({
          where: { workspaceId, contactId, direction: 'inbound' },
        });
        shouldTrigger = existingMessages === 1;
      }

      if (shouldTrigger) {
        const wa = await prisma.waAccount.findUnique({
          where: { workspaceId },
        });

        if (!wa) continue;

        const contact = await prisma.contact.findUnique({
          where: { id: contactId },
        });

        if (!contact) continue;

        if (responder.delayMinutes > 0) {
          await prisma.pendingAutoresponse.create({
            data: {
              workspaceId,
              contactId,
              conversationId,
              message: messageToSend,
              sendAt: new Date(Date.now() + responder.delayMinutes * 60 * 1000),
            },
          });
        } else {
          await sendWhatsAppText({
            accessToken: wa.accessToken,
            phoneNumberId: wa.phoneNumberId,
            to: contact.phone,
            text: messageToSend,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing autoresponders:', error);
  }
}
