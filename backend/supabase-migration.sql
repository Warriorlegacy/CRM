-- =============================================================
-- Signhify CRM — Complete Supabase Migration SQL
-- Apply this in Supabase Dashboard → SQL Editor
-- Covers all 37 tables from Prisma schema
-- =============================================================

-- 1. User
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    "emailVerified" BOOLEAN DEFAULT false,
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 2. Workspace
CREATE TABLE IF NOT EXISTS "Workspace" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    "ownerId" TEXT NOT NULL REFERENCES "User"(id),
    plan TEXT DEFAULT 'free',
    "businessHoursEnabled" BOOLEAN DEFAULT false,
    "businessHoursJson" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workspace_owner ON "Workspace"("ownerId");

-- 3. WorkspaceMember
CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'agent',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("workspaceId", "userId")
);
CREATE INDEX IF NOT EXISTS idx_workspace_member_user ON "WorkspaceMember"("userId");

-- 4. WaAccount (WhatsApp Business Account)
CREATE TABLE IF NOT EXISTS "WaAccount" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL UNIQUE REFERENCES "Workspace"(id) ON DELETE CASCADE,
    "phoneNumberId" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookVerifyToken" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 5. IgAccount (Instagram Business Account)
CREATE TABLE IF NOT EXISTS "IgAccount" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL UNIQUE REFERENCES "Workspace"(id) ON DELETE CASCADE,
    "igUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookVerifyToken" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 6. Contact
CREATE TABLE IF NOT EXISTS "Contact" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    "igUsername" TEXT,
    "profilePicture" TEXT,
    tags TEXT DEFAULT '',
    stage TEXT DEFAULT 'new',
    "leadScore" INTEGER DEFAULT 0,
    channel TEXT DEFAULT 'whatsapp',
    "assignedToId" TEXT REFERENCES "User"(id),
    "lastMessageAt" TIMESTAMPTZ,
    "unreadCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("workspaceId", phone)
);
CREATE INDEX IF NOT EXISTS idx_contact_workspace_stage ON "Contact"("workspaceId", stage);
CREATE INDEX IF NOT EXISTS idx_contact_assigned ON "Contact"("assignedToId");
CREATE INDEX IF NOT EXISTS idx_contact_ig_username ON "Contact"("igUsername");
CREATE INDEX IF NOT EXISTS idx_contact_channel ON "Contact"(channel);
CREATE INDEX IF NOT EXISTS idx_contact_email ON "Contact"(email);
CREATE INDEX IF NOT EXISTS idx_contact_last_message ON "Contact"("lastMessageAt");

-- 7. Conversation
CREATE TABLE IF NOT EXISTS "Conversation" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
    "contactId" TEXT NOT NULL REFERENCES "Contact"(id) ON DELETE CASCADE,
    channel TEXT DEFAULT 'whatsapp',
    status TEXT DEFAULT 'open',
    "lastReadAt" TIMESTAMPTZ,
    "lockedByUserId" TEXT,
    "lockedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    tags TEXT[] DEFAULT '{}',
    "lastKnownLanguage" TEXT DEFAULT 'en',
    UNIQUE("workspaceId", "contactId")
);
CREATE INDEX IF NOT EXISTS idx_conversation_workspace ON "Conversation"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_conversation_contact ON "Conversation"("contactId");
CREATE INDEX IF NOT EXISTS idx_conversation_channel ON "Conversation"(channel);
CREATE INDEX IF NOT EXISTS idx_conversation_status ON "Conversation"("workspaceId", status);
CREATE INDEX IF NOT EXISTS idx_conversation_updated ON "Conversation"("workspaceId", "updatedAt");

-- 8. TypingIndicator
CREATE TABLE IF NOT EXISTS "TypingIndicator" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "workspaceId" TEXT NOT NULL,
    status TEXT DEFAULT 'idle',
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("conversationId", "userId")
);
CREATE INDEX IF NOT EXISTS idx_typing_conversation ON "TypingIndicator"("conversationId");
CREATE INDEX IF NOT EXISTS idx_typing_user ON "TypingIndicator"("userId");
CREATE INDEX IF NOT EXISTS idx_typing_updated ON "TypingIndicator"("updatedAt");

-- 9. Message
CREATE TABLE IF NOT EXISTS "Message" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
    "contactId" TEXT NOT NULL REFERENCES "Contact"(id) ON DELETE CASCADE,
    channel TEXT DEFAULT 'whatsapp',
    direction TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    "bodyText" TEXT,
    "waMessageId" TEXT,
    "igMessageId" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "mediaMimeType" TEXT,
    "sentByUserId" TEXT REFERENCES "User"(id),
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_message_workspace ON "Message"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_message_conversation ON "Message"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_message_contact ON "Message"("contactId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_message_wa ON "Message"("waMessageId");
CREATE INDEX IF NOT EXISTS idx_message_ig ON "Message"("igMessageId");
CREATE INDEX IF NOT EXISTS idx_message_direction ON "Message"(direction);
CREATE INDEX IF NOT EXISTS idx_message_sender ON "Message"("sentByUserId");

-- 10. ReadReceipt
CREATE TABLE IF NOT EXISTS "ReadReceipt" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "messageId" TEXT NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "readAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("messageId", "userId")
);
CREATE INDEX IF NOT EXISTS idx_read_receipt_message ON "ReadReceipt"("messageId");
CREATE INDEX IF NOT EXISTS idx_read_receipt_user ON "ReadReceipt"("userId");

-- 11. Followup
CREATE TABLE IF NOT EXISTS "Followup" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
    "contactId" TEXT NOT NULL REFERENCES "Contact"(id) ON DELETE CASCADE,
    "assignedToId" TEXT REFERENCES "User"(id),
    "dueAt" TIMESTAMPTZ NOT NULL,
    note TEXT,
    status TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_followup_workspace_status ON "Followup"("workspaceId", status, "dueAt");
CREATE INDEX IF NOT EXISTS idx_followup_assignee ON "Followup"("assignedToId");

-- 12. Template
CREATE TABLE IF NOT EXISTS "Template" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT DEFAULT 'utility',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_template_workspace ON "Template"("workspaceId");

-- 13. ContactNote
CREATE TABLE IF NOT EXISTS "ContactNote" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    channel TEXT,
    type TEXT DEFAULT 'note',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_note_workspace ON "ContactNote"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_contact_note_contact ON "ContactNote"("contactId");

-- 14. ConversationNote
CREATE TABLE IF NOT EXISTS "ConversationNote" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    mentions TEXT DEFAULT '[]',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversation_note_lookup ON "ConversationNote"("workspaceId", "conversationId", "createdAt");

-- 15. Autoresponder
CREATE TABLE IF NOT EXISTS "Autoresponder" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    keyword TEXT,
    "delayMinutes" INTEGER DEFAULT 0,
    message TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    stages TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_autoresponder_workspace ON "Autoresponder"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_autoresponder_active ON "Autoresponder"("isActive");

-- 16. PendingAutoresponse
CREATE TABLE IF NOT EXISTS "PendingAutoresponse" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    message TEXT NOT NULL,
    "sendAt" TIMESTAMPTZ NOT NULL,
    sent BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pending_auto_send ON "PendingAutoresponse"("sendAt", sent);
CREATE INDEX IF NOT EXISTS idx_pending_auto_workspace ON "PendingAutoresponse"("workspaceId");

-- 17. WebhookLog
CREATE TABLE IF NOT EXISTS "WebhookLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'success',
    error TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_log_workspace ON "WebhookLog"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_webhook_log_type ON "WebhookLog"(type);
CREATE INDEX IF NOT EXISTS idx_webhook_log_created ON "WebhookLog"("createdAt");

-- 18. ChatbotFlow
CREATE TABLE IF NOT EXISTS "ChatbotFlow" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    trigger TEXT DEFAULT 'keyword',
    "triggerKeyword" TEXT,
    channels TEXT DEFAULT 'whatsapp,instagram',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chatbot_flow_workspace ON "ChatbotFlow"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_chatbot_flow_active ON "ChatbotFlow"("isActive");

-- 19. FlowNode
CREATE TABLE IF NOT EXISTS "FlowNode" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "flowId" TEXT NOT NULL REFERENCES "ChatbotFlow"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT,
    content TEXT,
    "positionX" DOUBLE PRECISION DEFAULT 0,
    "positionY" DOUBLE PRECISION DEFAULT 0,
    config TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flow_node_flow ON "FlowNode"("flowId");

-- 20. FlowEdge
CREATE TABLE IF NOT EXISTS "FlowEdge" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "flowId" TEXT NOT NULL REFERENCES "ChatbotFlow"(id) ON DELETE CASCADE,
    "sourceId" TEXT NOT NULL REFERENCES "FlowNode"(id) ON DELETE CASCADE,
    "targetId" TEXT NOT NULL REFERENCES "FlowNode"(id) ON DELETE CASCADE,
    label TEXT,
    condition TEXT
);
CREATE INDEX IF NOT EXISTS idx_flow_edge_flow ON "FlowEdge"("flowId");
CREATE INDEX IF NOT EXISTS idx_flow_edge_source ON "FlowEdge"("sourceId");
CREATE INDEX IF NOT EXISTS idx_flow_edge_target ON "FlowEdge"("targetId");

-- 21. FlowExecution
CREATE TABLE IF NOT EXISTS "FlowExecution" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "flowId" TEXT NOT NULL REFERENCES "ChatbotFlow"(id) ON DELETE CASCADE,
    "contactId" TEXT NOT NULL REFERENCES "Contact"(id) ON DELETE CASCADE,
    "currentNodeId" TEXT,
    status TEXT DEFAULT 'active',
    context TEXT,
    "startedAt" TIMESTAMPTZ DEFAULT now(),
    "completedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_flow_execution_flow ON "FlowExecution"("flowId");
CREATE INDEX IF NOT EXISTS idx_flow_execution_contact ON "FlowExecution"("contactId");
CREATE INDEX IF NOT EXISTS idx_flow_execution_status ON "FlowExecution"(status);

-- 22. LeadScoringRule
CREATE TABLE IF NOT EXISTS "LeadScoringRule" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    name TEXT NOT NULL,
    event TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    conditions TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_score_workspace ON "LeadScoringRule"("workspaceId");

-- 23. AiProvider
CREATE TABLE IF NOT EXISTS "AiProvider" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    model TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "maxTokens" INTEGER DEFAULT 1024,
    temperature DOUBLE PRECISION DEFAULT 0.7,
    "lastUsedAt" TIMESTAMPTZ,
    "lastErrorAt" TIMESTAMPTZ,
    "errorCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_provider_workspace ON "AiProvider"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_ai_provider_active ON "AiProvider"("workspaceId", "isActive");

-- 24. AiConversationSummary
CREATE TABLE IF NOT EXISTS "AiConversationSummary" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    summary TEXT NOT NULL,
    sentiment TEXT,
    "keyTopics" TEXT,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_summary_workspace ON "AiConversationSummary"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_ai_summary_conversation ON "AiConversationSummary"("conversationId");

-- 25. AiAutoReplyLog
CREATE TABLE IF NOT EXISTS "AiAutoReplyLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "incomingMessage" TEXT NOT NULL,
    "aiReply" TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    "latencyMs" INTEGER,
    confidence DOUBLE PRECISION,
    "wasSent" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_reply_workspace ON "AiAutoReplyLog"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_ai_reply_conversation ON "AiAutoReplyLog"("conversationId");
CREATE INDEX IF NOT EXISTS idx_ai_reply_created ON "AiAutoReplyLog"("createdAt");

-- 26. VerificationToken
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    token TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verification_token_token ON "VerificationToken"(token);
CREATE INDEX IF NOT EXISTS idx_verification_token_user ON "VerificationToken"("userId");

-- 27. AwayMessage
CREATE TABLE IF NOT EXISTS "AwayMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    "showWhenNoAgent" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_away_message_workspace ON "AwayMessage"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_away_message_active ON "AwayMessage"("workspaceId", "isActive", priority);

-- 28. Broadcast
CREATE TABLE IF NOT EXISTS "Broadcast" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    "recipientFilter" TEXT,
    status TEXT DEFAULT 'draft',
    "scheduledAt" TIMESTAMPTZ,
    "sentAt" TIMESTAMPTZ,
    "totalRecipients" INTEGER DEFAULT 0,
    "sentCount" INTEGER DEFAULT 0,
    "deliveredCount" INTEGER DEFAULT 0,
    "failedCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_broadcast_workspace ON "Broadcast"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_broadcast_status ON "Broadcast"(status);

-- 29. BroadcastMessage
CREATE TABLE IF NOT EXISTS "BroadcastMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "broadcastId" TEXT NOT NULL REFERENCES "Broadcast"(id) ON DELETE CASCADE,
    "contactId" TEXT NOT NULL REFERENCES "Contact"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    "waMessageId" TEXT,
    error TEXT,
    "sentAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_broadcast_msg_broadcast ON "BroadcastMessage"("broadcastId");
CREATE INDEX IF NOT EXISTS idx_broadcast_msg_contact ON "BroadcastMessage"("contactId");
CREATE INDEX IF NOT EXISTS idx_broadcast_msg_status ON "BroadcastMessage"(status);

-- 30. ConversationTag
CREATE TABLE IF NOT EXISTS "ConversationTag" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    description TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("workspaceId", name)
);
CREATE INDEX IF NOT EXISTS idx_conversation_tag_workspace ON "ConversationTag"("workspaceId");

-- 31. ConversationTagAssignment
CREATE TABLE IF NOT EXISTS "ConversationTagAssignment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
    "tagId" TEXT NOT NULL REFERENCES "ConversationTag"(id) ON DELETE CASCADE,
    "assignedAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("conversationId", "tagId")
);
CREATE INDEX IF NOT EXISTS idx_tag_assignment_tag ON "ConversationTagAssignment"("tagId");
CREATE INDEX IF NOT EXISTS idx_tag_assignment_conversation ON "ConversationTagAssignment"("conversationId");
CREATE INDEX IF NOT EXISTS idx_tag_assignment_workspace ON "ConversationTagAssignment"("workspaceId");

-- 32. AgentActivity
CREATE TABLE IF NOT EXISTS "AgentActivity" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_activity_lookup ON "AgentActivity"("workspaceId", "conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_agent_activity_user ON "AgentActivity"("userId");

-- 33. EmailCampaign
CREATE TABLE IF NOT EXISTS "EmailCampaign" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "replyTo" TEXT,
    status TEXT DEFAULT 'draft',
    "recipientFilter" TEXT,
    "scheduledAt" TIMESTAMPTZ,
    "sentAt" TIMESTAMPTZ,
    "totalRecipients" INTEGER DEFAULT 0,
    "sentCount" INTEGER DEFAULT 0,
    "failedCount" INTEGER DEFAULT 0,
    "openedCount" INTEGER DEFAULT 0,
    "clickedCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_campaign_workspace ON "EmailCampaign"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_email_campaign_status ON "EmailCampaign"(status);

-- 34. EmailLog
CREATE TABLE IF NOT EXISTS "EmailLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "campaignId" TEXT NOT NULL REFERENCES "EmailCampaign"(id) ON DELETE CASCADE,
    "contactId" TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error TEXT,
    "openedAt" TIMESTAMPTZ,
    "clickedAt" TIMESTAMPTZ,
    "sentAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_log_campaign ON "EmailLog"("campaignId");
CREATE INDEX IF NOT EXISTS idx_email_log_contact ON "EmailLog"("contactId");
CREATE INDEX IF NOT EXISTS idx_email_log_status ON "EmailLog"(status);

-- 35. EmailAutomationRule
CREATE TABLE IF NOT EXISTS "EmailAutomationRule" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    condition TEXT,
    "templateId" TEXT,
    subject TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "senderName" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_auto_workspace ON "EmailAutomationRule"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_email_auto_active ON "EmailAutomationRule"("isActive");

-- 36. SmtpConfig
CREATE TABLE IF NOT EXISTS "SmtpConfig" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL UNIQUE,
    host TEXT DEFAULT 'smtp.gmail.com',
    port INTEGER DEFAULT 587,
    secure BOOLEAN DEFAULT false,
    "user" TEXT NOT NULL,
    pass TEXT NOT NULL,
    "fromName" TEXT,
    "fromEmail" TEXT,
    "isVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 37. Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT,
    link TEXT,
    read BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notification_workspace_created ON "Notification"("workspaceId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_workspace_read ON "Notification"("workspaceId", read);

-- =============================================================
-- Verify: list all tables
-- =============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
