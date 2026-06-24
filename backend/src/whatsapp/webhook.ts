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

  if (type === 'text') {
    bodyText = messages.text?.body || null;
  }

  return {
    phoneNumberId: metadata?.phone_number_id as string,
    from,
    waMessageId,
    type,
    bodyText,
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
      type:
        inbound.type === 'image'
          ? 'image'
          : inbound.type === 'document'
          ? 'document'
          : 'text',
      bodyText: inbound.bodyText,
      waMessageId: inbound.waMessageId,
      sentByUserId: null,
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
    },
    unreadCount: contact.unreadCount,
  });

  // 5) Process autoresponders
  await processAutoresponders(workspace.id, contact.id, conversation.id, inbound.bodyText);

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
  messageText: string | null
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

      if (responder.trigger === 'keyword' && responder.keyword) {
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
          setTimeout(async () => {
            await sendWhatsAppText({
              accessToken: wa.accessToken,
              phoneNumberId: wa.phoneNumberId,
              to: contact.phone,
              text: responder.message,
            });
          }, responder.delayMinutes * 60 * 1000);
        } else {
          await sendWhatsAppText({
            accessToken: wa.accessToken,
            phoneNumberId: wa.phoneNumberId,
            to: contact.phone,
            text: responder.message,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing autoresponders:', error);
  }
}
