-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
-- (No enums defined in schema)

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'agent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WaAccount" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookVerifyToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IgAccount" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookVerifyToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IgAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "igUsername" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT 'new',
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "assignedToId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TypingIndicator" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypingIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "bodyText" TEXT,
    "waMessageId" TEXT,
    "igMessageId" TEXT,
    "sentByUserId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReadReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Followup" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Followup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Template" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'utility',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactNote" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "channel" TEXT,
    "type" TEXT NOT NULL DEFAULT 'note',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Autoresponder" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "keyword" TEXT,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stages" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Autoresponder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatbotFlow" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trigger" TEXT NOT NULL DEFAULT 'keyword',
    "triggerKeyword" TEXT,
    "channels" TEXT NOT NULL DEFAULT 'whatsapp,instagram',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FlowNode" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "content" TEXT,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FlowEdge" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT,
    "condition" TEXT,

    CONSTRAINT "FlowEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FlowExecution" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "currentNodeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "context" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FlowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadScoringRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "conditions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadScoringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiProvider" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "model" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxTokens" INTEGER NOT NULL DEFAULT 1024,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "lastUsedAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiConversationSummary" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sentiment" TEXT,
    "keyTopics" TEXT,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConversationSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiAutoReplyLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "incomingMessage" TEXT NOT NULL,
    "aiReply" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "confidence" DOUBLE PRECISION,
    "wasSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAutoReplyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "public"."Workspace"("slug");
CREATE INDEX "Workspace_ownerId_idx" ON "public"."Workspace"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "public"."WorkspaceMember"("workspaceId", "userId");
CREATE INDEX "WorkspaceMember_userId_idx" ON "public"."WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WaAccount_workspaceId_key" ON "public"."WaAccount"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "IgAccount_workspaceId_key" ON "public"."IgAccount"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_workspaceId_phone_key" ON "public"."Contact"("workspaceId", "phone");
CREATE INDEX "Contact_workspaceId_stage_idx" ON "public"."Contact"("workspaceId", "stage");
CREATE INDEX "Contact_assignedToId_idx" ON "public"."Contact"("assignedToId");
CREATE INDEX "Contact_igUsername_idx" ON "public"."Contact"("igUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_workspaceId_contactId_key" ON "public"."Conversation"("workspaceId", "contactId");
CREATE INDEX "Conversation_workspaceId_idx" ON "public"."Conversation"("workspaceId");
CREATE INDEX "Conversation_contactId_idx" ON "public"."Conversation"("contactId");
CREATE INDEX "Conversation_channel_idx" ON "public"."Conversation"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "TypingIndicator_conversationId_userId_key" ON "public"."TypingIndicator"("conversationId", "userId");
CREATE INDEX "TypingIndicator_conversationId_idx" ON "public"."TypingIndicator"("conversationId");
CREATE INDEX "TypingIndicator_userId_idx" ON "public"."TypingIndicator"("userId");
CREATE INDEX "TypingIndicator_updatedAt_idx" ON "public"."TypingIndicator"("updatedAt");

-- CreateIndex
CREATE INDEX "Message_workspaceId_createdAt_idx" ON "public"."Message"("workspaceId", "createdAt");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "public"."Message"("conversationId", "createdAt");
CREATE INDEX "Message_contactId_createdAt_idx" ON "public"."Message"("contactId", "createdAt");
CREATE INDEX "Message_waMessageId_idx" ON "public"."Message"("waMessageId");
CREATE INDEX "Message_igMessageId_idx" ON "public"."Message"("igMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadReceipt_messageId_userId_key" ON "public"."ReadReceipt"("messageId", "userId");
CREATE INDEX "ReadReceipt_messageId_idx" ON "public"."ReadReceipt"("messageId");
CREATE INDEX "ReadReceipt_userId_idx" ON "public"."ReadReceipt"("userId");

-- CreateIndex
CREATE INDEX "Followup_workspaceId_status_dueAt_idx" ON "public"."Followup"("workspaceId", "status", "dueAt");
CREATE INDEX "Followup_assignedToId_idx" ON "public"."Followup"("assignedToId");

-- CreateIndex
CREATE INDEX "Template_workspaceId_idx" ON "public"."Template"("workspaceId");

-- CreateIndex
CREATE INDEX "ContactNote_workspaceId_idx" ON "public"."ContactNote"("workspaceId");
CREATE INDEX "ContactNote_contactId_idx" ON "public"."ContactNote"("contactId");

-- CreateIndex
CREATE INDEX "Autoresponder_workspaceId_idx" ON "public"."Autoresponder"("workspaceId");
CREATE INDEX "Autoresponder_isActive_idx" ON "public"."Autoresponder"("isActive");

-- CreateIndex
CREATE INDEX "WebhookLog_workspaceId_idx" ON "public"."WebhookLog"("workspaceId");
CREATE INDEX "WebhookLog_type_idx" ON "public"."WebhookLog"("type");
CREATE INDEX "WebhookLog_createdAt_idx" ON "public"."WebhookLog"("createdAt");

-- CreateIndex
CREATE INDEX "ChatbotFlow_workspaceId_idx" ON "public"."ChatbotFlow"("workspaceId");
CREATE INDEX "ChatbotFlow_isActive_idx" ON "public"."ChatbotFlow"("isActive");

-- CreateIndex
CREATE INDEX "FlowNode_flowId_idx" ON "public"."FlowNode"("flowId");

-- CreateIndex
CREATE INDEX "FlowEdge_flowId_idx" ON "public"."FlowEdge"("flowId");
CREATE INDEX "FlowEdge_sourceId_idx" ON "public"."FlowEdge"("sourceId");
CREATE INDEX "FlowEdge_targetId_idx" ON "public"."FlowEdge"("targetId");

-- CreateIndex
CREATE INDEX "FlowExecution_flowId_idx" ON "public"."FlowExecution"("flowId");
CREATE INDEX "FlowExecution_contactId_idx" ON "public"."FlowExecution"("contactId");
CREATE INDEX "FlowExecution_status_idx" ON "public"."FlowExecution"("status");

-- CreateIndex
CREATE INDEX "LeadScoringRule_workspaceId_idx" ON "public"."LeadScoringRule"("workspaceId");

-- CreateIndex
CREATE INDEX "AiProvider_workspaceId_idx" ON "public"."AiProvider"("workspaceId");
CREATE INDEX "AiProvider_workspaceId_isActive_idx" ON "public"."AiProvider"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "AiConversationSummary_workspaceId_idx" ON "public"."AiConversationSummary"("workspaceId");
CREATE INDEX "AiConversationSummary_conversationId_idx" ON "public"."AiConversationSummary"("conversationId");

-- CreateIndex
CREATE INDEX "AiAutoReplyLog_workspaceId_idx" ON "public"."AiAutoReplyLog"("workspaceId");
CREATE INDEX "AiAutoReplyLog_conversationId_idx" ON "public"."AiAutoReplyLog"("conversationId");
CREATE INDEX "AiAutoReplyLog_createdAt_idx" ON "public"."AiAutoReplyLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WaAccount" ADD CONSTRAINT "WaAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IgAccount" ADD CONSTRAINT "IgAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TypingIndicator" ADD CONSTRAINT "TypingIndicator_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TypingIndicator" ADD CONSTRAINT "TypingIndicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReadReceipt" ADD CONSTRAINT "ReadReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReadReceipt" ADD CONSTRAINT "ReadReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Followup" ADD CONSTRAINT "Followup_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Followup" ADD CONSTRAINT "Followup_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Followup" ADD CONSTRAINT "Followup_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Template" ADD CONSTRAINT "Template_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatbotFlow" ADD CONSTRAINT "ChatbotFlow_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlowNode" ADD CONSTRAINT "FlowNode_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "public"."ChatbotFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlowEdge" ADD CONSTRAINT "FlowEdge_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "public"."ChatbotFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlowEdge" ADD CONSTRAINT "FlowEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."FlowNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlowEdge" ADD CONSTRAINT "FlowEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."FlowNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlowExecution" ADD CONSTRAINT "FlowExecution_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "public"."ChatbotFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlowExecution" ADD CONSTRAINT "FlowExecution_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
