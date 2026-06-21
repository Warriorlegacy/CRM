import { prisma } from '../prisma';
import { publish } from '../realtime/events';
import { sendInstagramMessage } from './graph';
import { InstagramWebhookBody, ParsedInboundInstagram } from './types';
import { processChatbotMessage } from '../services/chatbotEngine';
import { processLeadScore } from '../services/leadScoring';
import { processAutomation } from '../services/aiAutomation';

function parseInboundMessage(payload: InstagramWebhookBody): ParsedInboundInstagram | null {
  const entry = payload?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  const messagingEvent = value?.messaging?.[0];
  if (!messagingEvent) return null;

  const message = messagingEvent.message;
  if (!message || message.is_echo) return null;

  const from = messagingEvent.sender.id;
  const igMessageId = message.mid;
  const type = message.attachments ? message.attachments[0]?.type || 'text' : 'text';

  let bodyText: string | null = null;
  if (message.text) {
    bodyText = message.text;
  }

  return {
    igUserId: entry.id,
    from,
    igMessageId,
    type,
    bodyText,
    raw: payload,
  };
}

async function findWorkspaceByIgUserId(igUserId: string) {
  const ig = await prisma.igAccount.findFirst({
    where: { igUserId },
    include: { workspace: true },
  });
  return ig?.workspace || null;
}

export async function handleInstagramWebhook(payload: InstagramWebhookBody) {
  const inbound = parseInboundMessage(payload);
  if (!inbound) return { ok: true, ignored: true };

  const workspace = await findWorkspaceByIgUserId(inbound.igUserId);
  if (!workspace) {
    return { ok: false, error: 'Workspace not found for igUserId' };
  }

  const contact = await prisma.contact.upsert({
    where: {
      workspaceId_phone: {
        workspaceId: workspace.id,
        phone: `ig_${inbound.from}`,
      },
    },
    update: {
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
      igUsername: inbound.from,
      channel: 'instagram',
    },
    create: {
      workspaceId: workspace.id,
      phone: `ig_${inbound.from}`,
      igUsername: inbound.from,
      name: null,
      stage: 'new',
      tags: '',
      channel: 'instagram',
      lastMessageAt: new Date(),
      unreadCount: 1,
    },
  });

  const conversation = await prisma.conversation.upsert({
    where: {
      workspaceId_contactId: {
        workspaceId: workspace.id,
        contactId: contact.id,
      },
    },
    update: {
      status: 'open',
      channel: 'instagram',
    },
    create: {
      workspaceId: workspace.id,
      contactId: contact.id,
      channel: 'instagram',
      status: 'open',
    },
  });

  const message = await prisma.message.create({
    data: {
      workspaceId: workspace.id,
      conversationId: conversation.id,
      contactId: contact.id,
      channel: 'instagram',
      direction: 'inbound',
      type: inbound.type === 'image' ? 'image' : inbound.type === 'video' ? 'video' : 'text',
      bodyText: inbound.bodyText,
      igMessageId: inbound.igMessageId,
      sentByUserId: null,
    },
  });

  publish(workspace.id, {
    type: 'inbound_message',
    conversationId: conversation.id,
    contactId: contact.id,
    channel: 'instagram',
    message: {
      id: message.id,
      direction: 'inbound',
      bodyText: inbound.bodyText,
      type: message.type,
      channel: 'instagram',
      createdAt: message.createdAt,
    },
    unreadCount: contact.unreadCount,
  });

  await processAutoresponders(workspace.id, contact.id, conversation.id, inbound.bodyText, inbound.from);

  // 6) Process chatbot flows
  await processChatbotMessage({
    workspaceId: workspace.id,
    contactId: contact.id,
    conversationId: conversation.id,
    channel: 'instagram',
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
    channel: 'instagram',
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
  igFrom: string
) {
  try {
    const autoresponders = await prisma.$queryRaw<any[]>`
      SELECT * FROM Autoresponder 
      WHERE workspaceId = ${workspaceId}
      AND isActive = 1
    `;

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
        const ig = await prisma.igAccount.findUnique({
          where: { workspaceId },
        });
        if (!ig) continue;

        if (responder.delayMinutes > 0) {
          setTimeout(async () => {
            await sendInstagramMessage({
              accessToken: ig.accessToken,
              igUserId: ig.igUserId,
              recipientId: igFrom,
              text: responder.message,
            });
          }, responder.delayMinutes * 60 * 1000);
        } else {
          await sendInstagramMessage({
            accessToken: ig.accessToken,
            igUserId: ig.igUserId,
            recipientId: igFrom,
            text: responder.message,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing Instagram autoresponders:', error);
  }
}
