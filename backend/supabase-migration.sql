-- =============================================================
-- Signhify CRM — Supabase Migration SQL
-- Apply this in Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Notification table (real-time notification center)
CREATE TABLE IF NOT EXISTS "Notification" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workspaceId" TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT,
    link TEXT,
    read BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_workspace_created
    ON "Notification"("workspaceId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_notification_workspace_read
    ON "Notification"("workspaceId", read);

-- 2. EmailCampaign table (already exists, verify)
-- These were added in previous sessions — verify they exist
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

CREATE INDEX IF NOT EXISTS idx_email_campaign_workspace
    ON "EmailCampaign"("workspaceId");

CREATE INDEX IF NOT EXISTS idx_email_campaign_status
    ON "EmailCampaign"(status);

-- 3. EmailLog table
CREATE TABLE IF NOT EXISTS "EmailLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_email_log_campaign
    ON "EmailLog"("campaignId");

CREATE INDEX IF NOT EXISTS idx_email_log_contact
    ON "EmailLog"("contactId");

CREATE INDEX IF NOT EXISTS idx_email_log_status
    ON "EmailLog"(status);

-- 4. EmailAutomationRule table
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

CREATE INDEX IF NOT EXISTS idx_email_auto_workspace
    ON "EmailAutomationRule"("workspaceId");

CREATE INDEX IF NOT EXISTS idx_email_auto_active
    ON "EmailAutomationRule"("isActive");

-- 5. SmtpConfig table
CREATE TABLE IF NOT EXISTS "SmtpConfig" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "workspaceId" TEXT UNIQUE NOT NULL,
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

-- =============================================================
-- Verify: list all tables
-- =============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
