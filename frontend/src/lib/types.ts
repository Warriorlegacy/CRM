// ─── Core Entities ────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  user: User;
}

// ─── Contacts ─────────────────────────────────────────────────────

export interface Contact {
  id: string;
  workspaceId: string;
  name: string | null;
  phone: string;
  email: string | null;
  igUsername: string | null;
  tags: string;
  stage: string;
  leadScore: number;
  channel: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface ContactNote {
  id: string;
  workspaceId: string;
  contactId: string;
  userId: string;
  content: string;
  category: string;
  channel: string | null;
  createdAt: string;
}

// ─── Conversations & Messages ─────────────────────────────────────

export interface Conversation {
  id: string;
  workspaceId: string;
  contactId: string;
  channel: string;
  status: string;
  lastReadAt: string | null;
  contact: Contact | null;
  messages: Message[];
  unreadCount: number;
  // Inbox-specific fields returned by the API
  name: string;
  phone: string;
  stage: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  lastMessage: string;
  lastMessageAt: string | null;
}

export interface Message {
  id: string;
  workspaceId: string;
  conversationId: string;
  contactId: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  type: string;
  bodyText: string;
  waMessageId: string | null;
  sentByUserId: string | null;
  sentByUser: { id: string; name: string } | null;
  readAt: string | null;
  createdAt: string;
  readReceipts: { userId: string; user: { id: string; name: string } }[];
}

// ─── Follow-ups ───────────────────────────────────────────────────

export interface Followup {
  id: string;
  workspaceId: string;
  contactId: string;
  assignedToId: string | null;
  dueAt: string;
  note: string | null;
  status: 'pending' | 'done' | 'cancelled';
  contact: { id: string; name: string; phone: string };
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
}

// ─── Templates ────────────────────────────────────────────────────

export interface Template {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Chatbot Flows ────────────────────────────────────────────────

export interface ChatbotFlow {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  trigger: string;
  triggerKeyword: string | null;
  channels: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  _count?: { nodes: number; edges: number; executions: number };
}

export interface FlowNode {
  id: string;
  flowId: string;
  type: 'start' | 'message' | 'question' | 'condition' | 'action' | 'end';
  label: string | null;
  content: string | null;
  positionX: number;
  positionY: number;
  config: string | null;
}

export interface FlowEdge {
  id: string;
  flowId: string;
  sourceId: string;
  targetId: string;
  label: string | null;
  condition: string | null;
}

// ─── AI Providers ─────────────────────────────────────────────────

export interface AiProvider {
  id: string;
  workspaceId: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl: string | null;
  model: string;
  priority: number;
  isActive: boolean;
  maxTokens: number;
  temperature: number;
  lastUsedAt: string | null;
  lastErrorAt: string | null;
  errorCount: number;
  createdAt: string;
}

// ─── Webhook Logs ─────────────────────────────────────────────────

export interface WebhookLog {
  id: string;
  workspaceId: string;
  type: string;
  payload: string;
  status: string;
  error: string | null;
  createdAt: string;
}

// ─── Automation ───────────────────────────────────────────────────

export interface Autoresponder {
  id: string;
  workspaceId: string;
  name: string;
  trigger: string;
  keyword: string | null;
  delayMinutes: number;
  message: string;
  isActive: boolean;
  stages: string | null;
}

// ─── Dashboard & Analytics ────────────────────────────────────────

export interface DashboardStats {
  overview: {
    totalContacts: number;
    newContacts: number;
    totalMessages: number;
    pendingFollowups: number;
  };
  channelBreakdown: {
    whatsapp: { contacts: number; messages: number; conversations: number };
    instagram: { contacts: number; messages: number; conversations: number };
  };
  dailyMessages: { date: string; count: number }[];
  dailyMessagesByChannel: { date: string; whatsapp: number; instagram: number }[];
  stageDistribution: { stage: string; count: number }[];
  teamPerformance: {
    id: string;
    name: string;
    email: string;
    contactsAssigned: number;
    messagesSent: number;
  }[];
  leadMetrics: {
    totalLeads: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    frozenLeads: number;
    averageScore: number;
    convertedLeads: number;
    conversionRate: number;
  };
  chatbotMetrics: {
    totalFlows: number;
    activeFlows: number;
    completions: number;
    abandonments: number;
    abandonmentRate: string;
  };
  recentActivity: {
    id: string;
    contactName: string;
    contactPhone: string;
    channel: string;
    lastMessage: string;
    lastMessageAt: string;
  }[];
}

export type AnalyticsData = DashboardStats;

// ─── API Response Shapes ──────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
