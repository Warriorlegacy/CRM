# 🚀 OpenCode Session Continuation Prompt — Signhify CRM

> **Copy and paste the entire prompt below into OpenCode to seamlessly resume development with full context.**

---

```markdown
# 📌 Context & Instructions for OpenCode Agent

You are continuing pair-programming on **Signhify CRM** (Creator: **Piyush Raj Singh**).
Please review `session_context.md` in the workspace root for full architectural background.

---

## 🟢 Core System Architecture & Production Deployment

- **Repository**: `Warriorlegacy/CRM` (`d:\whatsapp-crm`)
- **Product Philosophy**: 1-Click Zero-Config Setup for non-technical users. No complex webhooks, no manual code pasting, no technical API key forms for end users.
- **Frontend App**: Next.js 16 (Turbopack) deployed on Vercel
  - Production Domain: `https://signhify-crm.vercel.app`
  - Alias Domain: `https://whatsapp-crm-frontend-three.vercel.app`
- **Backend API**: Express serverless API deployed on Vercel
  - Production Domain: `https://whatsapp-crm-backend-one.vercel.app`
  - Health Check: `GET https://whatsapp-crm-backend-one.vercel.app/health` (Returns 200 OK)
- **Database**: Supabase PostgreSQL
  - Transaction Pooler (Port 6543): `postgresql://postgres.iynilxlxxhbutyentjcj:Piyushrajput@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
  - Direct Session Pooler (Port 5432): `postgresql://postgres.iynilxlxxhbutyentjcj:Piyushrajput@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
  - Total Tables: 38 (including `Notification`, `EmailCampaign`, `EmailLog`, `ChatbotFlow`, `SmtpConfig`, `ConversationNote`)
- **Meta App Credentials (Configured in Vercel Backend)**:
  - `META_APP_ID`: `980883078083935`
  - `META_APP_SECRET`: `798886936e5226d9ff26608f511270cc`
  - `META_CONFIG_ID`: `1333150785194697` (Meta Business Login Config Name: **`Signhify`**)
  - `BACKEND_URL`: `https://whatsapp-crm-backend-one.vercel.app`
  - `FRONTEND_URL`: `https://signhify-crm.vercel.app`

---

## 📋 Completed Features & System Milestones (Phases 1–11)

1. **1-Click Zero-Config Meta OAuth (`/setup`)**:
   - Zero manual credential entry required for users.
   - Standard 1-Click `Connect WhatsApp` & `Connect Instagram` buttons redirect to Meta OAuth dialog with `&config_id=1333150785194697`.
   - `buildOAuthUrl` passes JWT in query string (`?token=...`) to prevent cross-domain cookie stripping loops.
   - Canonical `BACKEND_URL` prevents dynamic Vercel preview hostnames from failing Meta OAuth whitelist validation.

2. **Real-Time Notification System (`/notifications`)**:
   - Database model `Notification` synced to Supabase PostgreSQL.
   - Real-time push notifications over WebSockets (`notification:new`, `notification:read`, `notification:cleared`).
   - Triggered automatically on inbound WhatsApp messages, Instagram DMs, outbound messages, follow-up reminders, chatbot flow execution, and team invites.

3. **Analytics & Deep Reporting (`/reports`)**:
   - Overview, Pipeline, Team Leaderboard, and Data Export tabs.
   - One-click CSV export for Contacts, Conversations, and Messages (`/import-export`).

4. **Knowledge Base & Help Center (`/help`)**:
   - 24 categorized articles with live client-side search and read-time estimates.

5. **Bring Your Own Key (BYOK) AI Engine (`/ai`)**:
   - Supports OpenAI, Anthropic, Google Gemini, Groq, Ollama, DeepSeek, and custom OpenAI-compatible providers (`__custom__`).

6. **Database & Backend Health**:
   - 0 TypeScript compilation errors in frontend and backend.
   - 24/24 passing Jest unit tests in `backend` (`npm test`).

---

## 🎯 Primary Goal & Next Tasks for OpenCode

1. **Verify Session & Files**:
   - Read `session_context.md` to confirm the latest system state.
   - Read `frontend/src/app/(app)/setup/page.tsx` and `backend/src/routes/oauth.ts`.

2. **Immediate Task Priorities**:
   - **WhatsApp & Instagram Webhook Testing**: Test incoming message webhook handlers (`backend/src/routes/whatsapp/webhook.ts` & `backend/src/routes/instagram/webhook.ts`) and ensure messages populate the live Inbox (`/inbox`).
   - **AI Auto-Reply Validation**: Verify that AI auto-reply triggers seamlessly on incoming WhatsApp messages using the configured AI key or custom provider fallback chain.
   - **Chatbot Builder & Execution (`/chatbot`)**: Verify interactive chatbot flow node execution and state machine execution (`backend/src/services/chatbotEngine.ts`).
   - **Email Campaigns (`/email-automation`)**: Validate SMTP configuration test connection and automated drip email queue dispatching.

---

## ⚙️ Key File Locations

- `session_context.md`: Canonical project architectural context.
- `frontend/src/lib/api.ts`: API client configuration and OAuth URL helper.
- `frontend/src/app/(app)/setup/page.tsx`: WhatsApp & Instagram 1-click setup page.
- `backend/src/routes/oauth.ts`: Meta OAuth authorization & callback handler.
- `backend/src/env.ts`: Backend environment variable schema and validation.
- `backend/supabase-migration.sql`: PostgreSQL schema definitions.

Please confirm you have reviewed `session_context.md` and state the first task you will execute.
```
