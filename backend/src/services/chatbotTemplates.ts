import { prisma } from '../prisma';

export interface ChatbotTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: string;
  triggerKeyword?: string;
  nodes: any[];
  edges: any[];
}

export const CHATBOT_TEMPLATES: ChatbotTemplate[] = [
  {
    id: 'welcome-bot',
    name: 'Welcome Bot',
    description: 'Greets new contacts and collects basic information automatically.',
    category: 'onboarding',
    trigger: 'new_contact',
    nodes: [
      { id: 'start', type: 'start', label: 'Start', content: '', positionX: 250, positionY: 0 },
      { id: 'welcome', type: 'message', label: 'Welcome Message', content: 'Hi {name}! 👋 Welcome to our business. How can we help you today?', positionX: 250, positionY: 100 },
      { id: 'question1', type: 'question', label: 'Main Interest', content: 'What are you interested in?', positionX: 250, positionY: 200, config: JSON.stringify({ options: [{ label: 'Products' }, { label: 'Services' }, { label: 'Pricing' }, { label: 'Support' }] }) },
      { id: 'action1', type: 'action', label: 'Tag Interest', content: '', positionX: 250, positionY: 300, config: JSON.stringify({ action: 'add_tag', value: 'interested' }) },
      { id: 'end', type: 'end', label: 'End', content: '', positionX: 250, positionY: 400 },
    ],
    edges: [
      { id: 'e1', sourceId: 'start', targetId: 'welcome' },
      { id: 'e2', sourceId: 'welcome', targetId: 'question1' },
      { id: 'e3', sourceId: 'question1', targetId: 'action1', label: 'Products' },
      { id: 'e4', sourceId: 'question1', targetId: 'action1', label: 'Services' },
      { id: 'e5', sourceId: 'question1', targetId: 'action1', label: 'Pricing' },
      { id: 'e6', sourceId: 'question1', targetId: 'action1', label: 'Support' },
      { id: 'e7', sourceId: 'action1', targetId: 'end' },
    ],
  },
  {
    id: 'support-triage',
    name: 'Support Triage',
    description: 'Auto-categorizes support requests and routes to the right team.',
    category: 'support',
    trigger: 'keyword',
    triggerKeyword: 'support',
    nodes: [
      { id: 'start', type: 'start', label: 'Start', content: '', positionX: 250, positionY: 0 },
      { id: 'ack', type: 'message', label: 'Acknowledgment', content: 'We received your support request. Let us help you right away! 🛠️', positionX: 250, positionY: 100 },
      { id: 'question1', type: 'question', label: 'Issue Type', content: 'What type of issue are you experiencing?', positionX: 250, positionY: 200, config: JSON.stringify({ options: [{ label: 'Bug Report' }, { label: 'How To' }, { label: 'Account Issue' }, { label: 'Other' }] }) },
      { id: 'condition1', type: 'condition', label: 'Is Bug?', content: '', positionX: 250, positionY: 300, config: JSON.stringify({ field: 'answer:question1', operator: 'equals', value: 'Bug Report' }) },
      { id: 'bug_msg', type: 'message', label: 'Bug Instructions', content: 'Please describe the bug in detail. Include what you were doing when it happened. Our tech team will review it.', positionX: 150, positionY: 400 },
      { id: 'general_msg', type: 'message', label: 'General Support', content: 'Our team will review your request and get back to you within 2 hours. 📧', positionX: 350, positionY: 400 },
      { id: 'end', type: 'end', label: 'End', content: '', positionX: 250, positionY: 500 },
    ],
    edges: [
      { id: 'e1', sourceId: 'start', targetId: 'ack' },
      { id: 'e2', sourceId: 'ack', targetId: 'question1' },
      { id: 'e3', sourceId: 'question1', targetId: 'condition1' },
      { id: 'e4', sourceId: 'condition1', targetId: 'bug_msg', label: 'true' },
      { id: 'e5', sourceId: 'condition1', targetId: 'general_msg', label: 'false' },
      { id: 'e6', sourceId: 'bug_msg', targetId: 'end' },
      { id: 'e7', sourceId: 'general_msg', targetId: 'end' },
    ],
  },
  {
    id: 'sales-qualify',
    name: 'Sales Qualifier',
    description: 'Qualifies leads by collecting budget, timeline, and requirements.',
    category: 'sales',
    trigger: 'keyword',
    triggerKeyword: 'price',
    nodes: [
      { id: 'start', type: 'start', label: 'Start', content: '', positionX: 250, positionY: 0 },
      { id: 'greeting', type: 'message', label: 'Greeting', content: 'Great to hear from you, {name}! Let me help you find the right solution. 💼', positionX: 250, positionY: 100 },
      { id: 'q_budget', type: 'question', label: 'Budget', content: 'What is your approximate budget range?', positionX: 250, positionY: 200, config: JSON.stringify({ options: [{ label: 'Under $500' }, { label: '$500-$2000' }, { label: '$2000-$5000' }, { label: '$5000+' }] }) },
      { id: 'q_timeline', type: 'question', label: 'Timeline', content: 'When do you need this ready?', positionX: 250, positionY: 300, config: JSON.stringify({ options: [{ label: 'Immediately' }, { label: 'Within a month' }, { label: 'Within 3 months' }, { label: 'Just exploring' }] }) },
      { id: 'q_team', type: 'question', label: 'Team Size', content: 'How many people on your team will use this?', positionX: 250, positionY: 400 },
      { id: 'action', type: 'action', label: 'Tag as Lead', content: '', positionX: 250, positionY: 500, config: JSON.stringify({ action: 'add_tag', value: 'qualified_lead' }) },
      { id: 'action_stage', type: 'action', label: 'Move to Qualified', content: '', positionX: 250, positionY: 550, config: JSON.stringify({ action: 'update_stage', value: 'qualified' }) },
      { id: 'end_msg', type: 'message', label: 'Next Steps', content: 'Thanks for the details! Our sales team will reach out within 24 hours with a custom proposal. 📋', positionX: 250, positionY: 650 },
      { id: 'end', type: 'end', label: 'End', content: '', positionX: 250, positionY: 750 },
    ],
    edges: [
      { id: 'e1', sourceId: 'start', targetId: 'greeting' },
      { id: 'e2', sourceId: 'greeting', targetId: 'q_budget' },
      { id: 'e3', sourceId: 'q_budget', targetId: 'q_timeline' },
      { id: 'e4', sourceId: 'q_timeline', targetId: 'q_team' },
      { id: 'e5', sourceId: 'q_team', targetId: 'action' },
      { id: 'e6', sourceId: 'action', targetId: 'action_stage' },
      { id: 'e7', sourceId: 'action_stage', targetId: 'end_msg' },
      { id: 'e8', sourceId: 'end_msg', targetId: 'end' },
    ],
  },
  {
    id: 'booking-assistant',
    name: 'Booking Assistant',
    description: 'Helps customers book appointments or reservations.',
    category: 'booking',
    trigger: 'keyword',
    triggerKeyword: 'book',
    nodes: [
      { id: 'start', type: 'start', label: 'Start', content: '', positionX: 250, positionY: 0 },
      { id: 'welcome', type: 'message', label: 'Welcome', content: 'Sure, I can help you book! 📅 What would you like to book?', positionX: 250, positionY: 100 },
      { id: 'q_type', type: 'question', label: 'Booking Type', content: 'What type of appointment?', positionX: 250, positionY: 200, config: JSON.stringify({ options: [{ label: 'Consultation' }, { label: 'Demo' }, { label: 'Meeting' }, { label: 'Other' }] }) },
      { id: 'q_date', type: 'question', label: 'Preferred Date', content: 'What date works best for you? (e.g., tomorrow, Monday, June 25)', positionX: 250, positionY: 300 },
      { id: 'q_time', type: 'question', label: 'Preferred Time', content: 'What time do you prefer? (e.g., morning, 2pm, evening)', positionX: 250, positionY: 400 },
      { id: 'confirm', type: 'message', label: 'Confirmation', content: 'Perfect! Your {answer:q_type} is requested for {answer:q_date} at {answer:q_time}. Our team will confirm within 1 hour. ✅', positionX: 250, positionY: 500 },
      { id: 'action', type: 'action', label: 'Tag Booking', content: '', positionX: 250, positionY: 550, config: JSON.stringify({ action: 'add_tag', value: 'booking_request' }) },
      { id: 'end', type: 'end', label: 'End', content: '', positionX: 250, positionY: 650 },
    ],
    edges: [
      { id: 'e1', sourceId: 'start', targetId: 'welcome' },
      { id: 'e2', sourceId: 'welcome', targetId: 'q_type' },
      { id: 'e3', sourceId: 'q_type', targetId: 'q_date' },
      { id: 'e4', sourceId: 'q_date', targetId: 'q_time' },
      { id: 'e5', sourceId: 'q_time', targetId: 'confirm' },
      { id: 'e6', sourceId: 'confirm', targetId: 'action' },
      { id: 'e7', sourceId: 'action', targetId: 'end' },
    ],
  },
  {
    id: 'faq-bot',
    name: 'FAQ Bot',
    description: 'Answers common questions automatically using AI.',
    category: 'support',
    trigger: 'keyword',
    triggerKeyword: 'help',
    nodes: [
      { id: 'start', type: 'start', label: 'Start', content: '', positionX: 250, positionY: 0 },
      { id: 'ai_reply', type: 'ai_reply', label: 'AI Response', content: "You are a helpful FAQ assistant. Answer the customer question concisely. If you don't know the answer, say you'll connect them with a human agent.", positionX: 250, positionY: 100 },
      { id: 'end', type: 'end', label: 'End', content: '', positionX: 250, positionY: 200 },
    ],
    edges: [
      { id: 'e1', sourceId: 'start', targetId: 'ai_reply' },
      { id: 'e2', sourceId: 'ai_reply', targetId: 'end' },
    ],
  },
  {
    id: 'feedback-collector',
    name: 'Feedback Collector',
    description: 'Collects customer feedback and ratings automatically.',
    category: 'feedback',
    trigger: 'keyword',
    triggerKeyword: 'feedback',
    nodes: [
      { id: 'start', type: 'start', label: 'Start', content: '', positionX: 250, positionY: 0 },
      { id: 'ask_rating', type: 'question', label: 'Rating', content: 'How would you rate your experience? (1-10)', positionX: 250, positionY: 100 },
      { id: 'ask_feedback', type: 'question', label: 'Feedback', content: 'What did you like or what can we improve?', positionX: 250, positionY: 200 },
      { id: 'thank', type: 'message', label: 'Thank You', content: 'Thank you for your feedback, {name}! It helps us serve you better. 🙏', positionX: 250, positionY: 300 },
      { id: 'action', type: 'action', label: 'Tag Feedback', content: '', positionX: 250, positionY: 350, config: JSON.stringify({ action: 'add_tag', value: 'feedback_collected' }) },
      { id: 'end', type: 'end', label: 'End', content: '', positionX: 250, positionY: 450 },
    ],
    edges: [
      { id: 'e1', sourceId: 'start', targetId: 'ask_rating' },
      { id: 'e2', sourceId: 'ask_rating', targetId: 'ask_feedback' },
      { id: 'e3', sourceId: 'ask_feedback', targetId: 'thank' },
      { id: 'e4', sourceId: 'thank', targetId: 'action' },
      { id: 'e5', sourceId: 'action', targetId: 'end' },
    ],
  },
];

export async function createFlowFromTemplate(
  workspaceId: string,
  templateId: string
): Promise<string | null> {
  const template = CHATBOT_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const flow = await prisma.chatbotFlow.create({
    data: {
      workspaceId,
      name: template.name,
      description: template.description,
      trigger: template.trigger as any,
      triggerKeyword: template.triggerKeyword,
      channels: 'whatsapp,instagram',
      isActive: false,
      nodes: {
        create: template.nodes.map(n => ({
          type: n.type,
          label: n.label,
          content: n.content,
          positionX: n.positionX,
          positionY: n.positionY,
          config: n.config,
        })),
      },
    },
    include: { nodes: true },
  });

  const nodeMap = new Map<string, string>();
  template.nodes.forEach((clientNode, i) => {
    nodeMap.set(clientNode.id, flow.nodes[i]?.id || '');
  });

  for (const edge of template.edges) {
    const sourceDbId = nodeMap.get(edge.sourceId);
    const targetDbId = nodeMap.get(edge.targetId);
    if (sourceDbId && targetDbId) {
      await prisma.flowEdge.create({
        data: {
          flowId: flow.id,
          sourceId: sourceDbId,
          targetId: targetDbId,
          label: edge.label,
          condition: edge.condition,
        },
      });
    }
  }

  return flow.id;
}
