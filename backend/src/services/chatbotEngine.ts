import { prisma } from '../prisma';
import { publish } from '../realtime/events';
import { sendWhatsAppText } from '../whatsapp/meta';
import { sendInstagramMessage } from '../instagram/graph';
import { processLeadScore } from './leadScoring';
import { generateAutoReply } from '../ai/chain';

interface FlowContext {
  answers: Record<string, string>;
  variables: Record<string, string>;
}

export async function processChatbotMessage(params: {
  workspaceId: string;
  contactId: string;
  conversationId: string;
  channel: string;
  messageText: string | null;
  senderId: string;
}) {
  const { workspaceId, contactId, conversationId, channel, messageText, senderId } = params;

  // Check for active flow execution
  const activeExecution = await prisma.flowExecution.findFirst({
    where: {
      contactId,
      status: 'active',
    },
    include: {
      flow: {
        include: { nodes: true, edges: true },
      },
    },
  });

  if (activeExecution) {
    return await advanceFlow(activeExecution, messageText, senderId);
  }

  // Check if any flow should be triggered
  const flows = await prisma.chatbotFlow.findMany({
    where: {
      workspaceId,
      isActive: true,
      channels: { contains: channel },
    },
    include: { nodes: true, edges: true },
  });

  for (const flow of flows) {
    const shouldTrigger = await checkTrigger(flow, contactId, messageText);
    if (shouldTrigger) {
      return await startFlow(flow, contactId, conversationId, channel, senderId);
    }
  }

  return null;
}

async function checkTrigger(
  flow: any,
  contactId: string,
  messageText: string | null
): Promise<boolean> {
  switch (flow.trigger) {
    case 'keyword':
      if (flow.triggerKeyword && messageText) {
        return messageText.toLowerCase().includes(flow.triggerKeyword.toLowerCase());
      }
      return false;

    case 'new_contact': {
      const messageCount = await prisma.message.count({
        where: { contactId, direction: 'inbound' },
      });
      return messageCount <= 1;
    }

    case 'new_ig_contact': {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      if (!contact || contact.channel !== 'instagram') return false;
      const msgCount = await prisma.message.count({
        where: { contactId, direction: 'inbound', channel: 'instagram' },
      });
      return msgCount <= 1;
    }

    default:
      return false;
  }
}

async function startFlow(
  flow: any,
  contactId: string,
  conversationId: string,
  channel: string,
  senderId: string
) {
  // Find start node
  const startNode = flow.nodes.find((n: any) => n.type === 'start');
  if (!startNode) return null;

  // Find next node after start
  const startEdge = flow.edges.find((e: any) => e.sourceId === startNode.id);
  if (!startEdge) return null;

  const nextNode = flow.nodes.find((n: any) => n.id === startEdge.targetId);
  if (!nextNode) return null;

  // Create execution
  const execution = await prisma.flowExecution.create({
    data: {
      flowId: flow.id,
      contactId,
      currentNodeId: nextNode.id,
      status: 'active',
      context: JSON.stringify({ answers: {}, variables: {} }),
    },
  });

  // Send first message
  await sendFlowNodeMessage(nextNode, conversationId, contactId, channel, senderId, flow.workspaceId);

  return { flowStarted: true, flowId: flow.id, executionId: execution.id };
}

async function advanceFlow(
  execution: any,
  messageText: string | null,
  senderId: string
) {
  const flow = execution.flow;
  const currentNode = flow.nodes.find((n: any) => n.id === execution.currentNodeId);

  if (!currentNode) {
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: { status: 'abandoned' },
    });
    return null;
  }

  const context: FlowContext = JSON.parse(execution.context || '{}');

  // Store answer for question nodes
  if (currentNode.type === 'question' && messageText) {
    context.answers[currentNode.id] = messageText;
  }

  // Find next node
  let nextEdge = flow.edges.find((e: any) => e.sourceId === currentNode.id);

  // For question nodes with options, find matching edge
  if (currentNode.type === 'question' && currentNode.config) {
    try {
      const config = JSON.parse(currentNode.config);
      if (config.options && messageText) {
        const matchingOption = config.options.find((opt: any) =>
          opt.label.toLowerCase() === messageText.toLowerCase()
        );
        if (matchingOption) {
          nextEdge = flow.edges.find(
            (e: any) => e.sourceId === currentNode.id && e.label === matchingOption.label
          );
        }
      }
    } catch {}
  }

  // For condition nodes, evaluate condition
  if (currentNode.type === 'condition' && currentNode.config) {
    try {
      const config = JSON.parse(currentNode.config);
      const conditionMet = evaluateCondition(config, context);
      nextEdge = flow.edges.find(
        (e: any) =>
          e.sourceId === currentNode.id &&
          ((conditionMet && e.label === 'true') || (!conditionMet && e.label === 'false'))
      );
    } catch {}
  }

  if (!nextEdge) {
    // End of flow
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'completed',
        currentNodeId: null,
        context: JSON.stringify(context),
        completedAt: new Date(),
      },
    });

    // Process lead score for flow completion
    await processLeadScore({
      workspaceId: flow.workspaceId,
      contactId: execution.contactId,
      event: 'flow_completed',
    });

    return { flowCompleted: true };
  }

  const nextNode = flow.nodes.find((n: any) => n.id === nextEdge.targetId);
  if (!nextNode) {
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: { status: 'completed', currentNodeId: null },
    });
    return { flowCompleted: true };
  }

  // Handle action nodes
  if (nextNode.type === 'action' && nextNode.config) {
    await executeAction(nextNode, execution.contactId, flow.workspaceId);
  }

  // Handle AI reply nodes
  if (nextNode.type === 'ai_reply') {
    const aiResult = await handleAiReplyNode(nextNode, execution, flow.workspaceId);
    if (aiResult) {
      await prisma.flowExecution.update({
        where: { id: execution.id },
        data: { status: 'completed', currentNodeId: null, completedAt: new Date() },
      });
      return { flowCompleted: true, aiReply: true };
    }
  }

  // Update execution
  await prisma.flowExecution.update({
    where: { id: execution.id },
    data: {
      currentNodeId: nextNode.id,
      context: JSON.stringify(context),
    },
  });

  // If next node is end, complete the flow
  if (nextNode.type === 'end') {
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: { status: 'completed', currentNodeId: null, completedAt: new Date() },
    });
    return { flowCompleted: true };
  }

  // Send message for message/question nodes
  if (nextNode.type === 'message' || nextNode.type === 'question') {
    await sendFlowNodeMessage(
      nextNode,
      '', // conversationId - we'll look it up
      execution.contactId,
      '', // channel - we'll look it up
      senderId,
      flow.workspaceId
    );
  }

  return { flowAdvanced: true };
}

async function sendFlowNodeMessage(
  node: any,
  conversationId: string,
  contactId: string,
  channel: string,
  senderId: string,
  workspaceId: string
) {
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) return;

  const conv = conversationId
    ? { id: conversationId }
    : await prisma.conversation.findFirst({ where: { contactId, workspaceId } });

  if (!conv) return;

  const msgChannel = channel || contact.channel || 'whatsapp';
  let text = node.content || '';

  // Replace variables
  text = text.replace(/{name}/g, contact.name || 'there');
  text = text.replace(/{phone}/g, contact.phone);
  text = text.replace(/{channel}/g, msgChannel);

  // Send via appropriate channel
  try {
    if (msgChannel === 'instagram') {
      const ig = await prisma.igAccount.findUnique({ where: { workspaceId } });
      if (ig) {
        await sendInstagramMessage({
          accessToken: ig.accessToken,
          igUserId: ig.igUserId,
          recipientId: contact.igUsername || contact.phone.replace('ig_', ''),
          text,
        });
      }
    } else {
      const wa = await prisma.waAccount.findUnique({ where: { workspaceId } });
      if (wa) {
        await sendWhatsAppText({
          accessToken: wa.accessToken,
          phoneNumberId: wa.phoneNumberId,
          to: contact.phone,
          text,
        });
      }
    }

    // Store outbound message
    const message = await prisma.message.create({
      data: {
        workspaceId,
        conversationId: conv.id,
        contactId,
        channel: msgChannel,
        direction: 'outbound',
        type: 'text',
        bodyText: text,
        sentByUserId: null,
      },
    });

    publish(workspaceId, {
      type: 'outbound_message',
      conversationId: conv.id,
      channel: msgChannel,
      message: {
        id: message.id,
        direction: 'outbound',
        bodyText: text,
        type: 'text',
        channel: msgChannel,
        createdAt: message.createdAt,
        automated: true,
      },
    });
  } catch (error) {
    console.error(`Failed to send flow message via ${msgChannel}:`, error);
  }
}

async function executeAction(node: any, contactId: string, workspaceId: string) {
  try {
    const config = JSON.parse(node.config || '{}');

    if (config.action === 'update_stage' && config.value) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { stage: config.value },
      });
      await processLeadScore({ workspaceId, contactId, event: 'stage_progression' });
    }

    if (config.action === 'add_tag' && config.value) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      if (contact) {
        const tags = contact.tags ? contact.tags.split(',').map((t) => t.trim()) : [];
        if (!tags.includes(config.value)) {
          tags.push(config.value);
          await prisma.contact.update({
            where: { id: contactId },
            data: { tags: tags.join(',') },
          });
          await processLeadScore({ workspaceId, contactId, event: 'tag_added' });
        }
      }
    }

    if (config.action === 'assign' && config.value) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { assignedToId: config.value },
      });
    }
  } catch (error) {
    console.error('Flow action execution error:', error);
  }
}

async function handleAiReplyNode(node: any, execution: any, workspaceId: string): Promise<boolean> {
  try {
    const contact = await prisma.contact.findUnique({ where: { id: execution.contactId } });
    if (!contact) return false;

    const conversation = await prisma.conversation.findFirst({
      where: { contactId: execution.contactId, workspaceId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!conversation) return false;

    const lastInbound = conversation.messages.find((m) => m.direction === 'inbound');
    if (!lastInbound) return false;

    const history = conversation.messages.reverse().map((m) => ({
      role: (m.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.bodyText || '[media]',
    }));

    const systemPrompt = node.content || 'You are a helpful customer support assistant. Be concise and friendly.';
    const result = await generateAutoReply(workspaceId, lastInbound.bodyText || '', {
      contactName: contact.name || 'Customer',
      channel: conversation.channel,
      conversationHistory: history,
    });

    const text = result.content;
    const msgChannel = conversation.channel;

    if (msgChannel === 'instagram') {
      const ig = await prisma.igAccount.findUnique({ where: { workspaceId } });
      if (ig) {
        await sendInstagramMessage({
          accessToken: ig.accessToken,
          igUserId: ig.igUserId,
          recipientId: contact.igUsername || contact.phone.replace('ig_', ''),
          text,
        });
      }
    } else {
      const wa = await prisma.waAccount.findUnique({ where: { workspaceId } });
      if (wa) {
        await sendWhatsAppText({
          accessToken: wa.accessToken,
          phoneNumberId: wa.phoneNumberId,
          to: contact.phone,
          text,
        });
      }
    }

    await prisma.message.create({
      data: {
        workspaceId,
        conversationId: conversation.id,
        contactId: execution.contactId,
        channel: msgChannel,
        direction: 'outbound',
        type: 'text',
        bodyText: text,
        sentByUserId: null,
      },
    });

    await prisma.aiAutoReplyLog.create({
      data: {
        workspaceId,
        conversationId: conversation.id,
        contactId: execution.contactId,
        incomingMessage: lastInbound.bodyText || '',
        aiReply: text,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        wasSent: true,
      },
    });

    return true;
  } catch (error) {
    console.error('AI reply node error:', error);
    return false;
  }
}

function evaluateCondition(config: any, context: FlowContext): boolean {
  const { field, operator, value } = config;
  let actual = '';

  if (field.startsWith('answer:')) {
    const nodeId = field.replace('answer:', '');
    actual = context.answers[nodeId] || '';
  } else if (field === 'channel') {
    actual = context.variables.channel || '';
  }

  switch (operator) {
    case 'equals':
      return actual.toLowerCase() === value?.toLowerCase();
    case 'contains':
      return actual.toLowerCase().includes(value?.toLowerCase() || '');
    case 'not_empty':
      return actual.length > 0;
    default:
      return false;
  }
}
