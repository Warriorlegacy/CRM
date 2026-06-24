import { prisma } from '../prisma';
import { publish } from '../realtime/events';
import { chatWithFallback } from '../ai/chain';
import { sendWhatsAppText } from '../whatsapp/meta';
import { sendInstagramMessage } from '../instagram/graph';

export interface AutomationResult {
  category: string;
  priority: string;
  autoReply: string | null;
  tags: string[];
  assignedTo: string | null;
  sentiment: string;
}

export async function analyzeMessage(
  workspaceId: string,
  messageText: string,
  contactName: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<AutomationResult> {
  try {
    const historyText = conversationHistory.slice(-4).map(m =>
      `${m.role === 'user' ? 'Customer' : 'Agent'}: ${m.content}`
    ).join('\n');

    const prompt = `Analyze this customer message and return a JSON object with these fields:

{
  "category": "support|sales|billing|complaint|inquiry|spam|general",
  "priority": "urgent|high|medium|low",
  "sentiment": "positive|neutral|negative",
  "tags": ["tag1", "tag2"],
  "suggestedReply": "A helpful 1-2 sentence reply to this message",
  "needsHuman": false
}

Rules for categorization:
- "support": technical issues, how-to questions, bugs
- "sales": pricing, products, demos, purchasing intent
- "billing": payments, invoices, refunds, subscription
- "complaint": dissatisfaction, problems, escalation requests
- "inquiry": general questions about services/features
- "spam": irrelevant, promotional, or bot messages
- "general": everything else

Rules for priority:
- "urgent": angry customers, service outages, payment issues, time-sensitive
- "high": purchase intent, demo requests, escalation
- "medium": normal support questions, general inquiries
- "low": feedback, casual messages, thank yous

Rules for suggestedReply:
- Be concise (1-2 sentences)
- Be warm and professional
- Address the customer's specific concern
- If you don't know something, say you'll check
- Match the language the customer uses

Customer name: ${contactName}
Recent conversation:
${historyText}

New message: "${messageText}"

Reply with ONLY the JSON object, no other text.`;

    const result = await chatWithFallback(workspaceId, [
      { role: 'system', content: 'You are a message analysis AI. Output valid JSON only.' },
      { role: 'user', content: prompt },
    ]);

    let analysis;
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : getDefaultAnalysis();
    } catch {
      analysis = getDefaultAnalysis();
    }

    return {
      category: analysis.category || 'general',
      priority: analysis.priority || 'medium',
      autoReply: analysis.suggestedReply || null,
      tags: analysis.tags || [],
      assignedTo: null,
      sentiment: analysis.sentiment || 'neutral',
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return getDefaultAnalysis();
  }
}

function getDefaultAnalysis(): AutomationResult {
  return {
    category: 'general',
    priority: 'medium',
    autoReply: null,
    tags: [],
    assignedTo: null,
    sentiment: 'neutral',
  };
}

export async function autoAssign(
  workspaceId: string,
  category: string,
  priority: string
): Promise<string | null> {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (members.length === 0) return null;

    const contacts = await prisma.contact.findMany({
      where: { workspaceId, assignedToId: { not: null } },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });

    const assignmentCounts: Record<string, number> = {};
    for (const member of members) {
      assignmentCounts[member.userId] = 0;
    }
    for (const contact of contacts) {
      if (contact.assignedToId && assignmentCounts[contact.assignedToId] !== undefined) {
        assignmentCounts[contact.assignedToId]++;
      }
    }

    let minCount = Infinity;
    let assigneeId = members[0].userId;
    for (const [userId, count] of Object.entries(assignmentCounts)) {
      if (count < minCount) {
        minCount = count;
        assigneeId = userId;
      }
    }

    return assigneeId;
  } catch (error) {
    console.error('Auto-assign error:', error);
    return null;
  }
}

export async function sendAutoReply(
  workspaceId: string,
  contactId: string,
  conversationId: string,
  channel: string,
  replyText: string
): Promise<boolean> {
  try {
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return false;

    let sent = false;

    if (channel === 'instagram') {
      const ig = await prisma.igAccount.findUnique({ where: { workspaceId } });
      if (ig) {
        await sendInstagramMessage({
          accessToken: ig.accessToken,
          igUserId: ig.igUserId,
          recipientId: contact.igUsername || contact.phone.replace('ig_', ''),
          text: replyText,
        });
        sent = true;
      }
    } else {
      const wa = await prisma.waAccount.findUnique({ where: { workspaceId } });
      if (wa) {
        await sendWhatsAppText({
          accessToken: wa.accessToken,
          phoneNumberId: wa.phoneNumberId,
          to: contact.phone,
          text: replyText,
        });
        sent = true;
      }
    }

    if (sent) {
      const message = await prisma.message.create({
        data: {
          workspaceId,
          conversationId,
          contactId,
          channel,
          direction: 'outbound',
          type: 'text',
          bodyText: replyText,
          sentByUserId: null,
        },
      });

      await prisma.aiAutoReplyLog.create({
        data: {
          workspaceId,
          conversationId,
          contactId,
          incomingMessage: '',
          aiReply: replyText,
          provider: 'ai_automation',
          model: 'auto',
          latencyMs: 0,
          wasSent: true,
        },
      });

      publish(workspaceId, {
        type: 'outbound_message',
        conversationId,
        channel,
        message: {
          id: message.id,
          direction: 'outbound',
          bodyText: replyText,
          type: 'text',
          channel,
          createdAt: message.createdAt,
          automated: true,
        },
      });
    }

    return sent;
  } catch (error) {
    console.error('Send auto-reply error:', error);
    return false;
  }
}

export async function processAutomation(params: {
  workspaceId: string;
  contactId: string;
  conversationId: string;
  channel: string;
  messageText: string;
  contactName: string;
}) {
  const { workspaceId, contactId, conversationId, channel, messageText, contactName } = params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
      },
    });

    const history = (conversation?.messages || []).reverse().map(m => ({
      role: (m.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.bodyText || '[media]',
    }));

    const analysis = await analyzeMessage(workspaceId, messageText, contactName, history);

    const existingContact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (existingContact) {
      const existingTags = existingContact.tags ? existingContact.tags.split(',').map(t => t.trim()) : [];
      const newTags = [...new Set([...existingTags, ...analysis.tags, analysis.category])];

      await prisma.contact.update({
        where: { id: contactId },
        data: {
          tags: newTags.join(','),
          leadScore: Math.min(100, existingContact.leadScore + (analysis.priority === 'urgent' ? 10 : analysis.priority === 'high' ? 5 : 2)),
        },
      });
    }

    if (!existingContact?.assignedToId) {
      const assigneeId = await autoAssign(workspaceId, analysis.category, analysis.priority);
      if (assigneeId) {
        await prisma.contact.update({
          where: { id: contactId },
          data: { assignedToId: assigneeId },
        });
      }
    }

    if (analysis.autoReply && analysis.category !== 'spam') {
      await sendAutoReply(workspaceId, contactId, conversationId, channel, analysis.autoReply);
    }

    publish(workspaceId, {
      type: 'ai_automation',
      contactId,
      conversationId,
      analysis: {
        category: analysis.category,
        priority: analysis.priority,
        sentiment: analysis.sentiment,
        tags: analysis.tags,
        autoReplied: !!analysis.autoReply,
      },
    });

    return analysis;
  } catch (error) {
    console.error('Automation pipeline error:', error);
    return null;
  }
}
