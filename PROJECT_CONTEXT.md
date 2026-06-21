# WhatsApp CRM — Complete Session Context & Project Summary

> **Generated:** June 21, 2026  
> **Repository:** https://github.com/Warriorlegacy/CRM.git  
> **Current Status:** Production-deployed, awaiting Meta App approval for live OAuth

---

## 1. The Vision (Peak Goal)

**Build and deploy a full-stack, multi-tenant SaaS WhatsApp + Instagram CRM with AI-powered auto-replies, a visual chatbot flow builder, and a mini CRM pipeline — where users sign up, connect their messaging accounts via OAuth, add their own AI API keys, and start using it immediately with zero technical setup.**

This is not just a CRM. It is an **AI-native customer communication platform** that:

- Unifies WhatsApp and Instagram into a single inbox
- Uses AI to auto-categorize, auto-prioritize, auto-assign, auto-tag, and auto-reply to every incoming message
- Provides a visual drag-and-drop chatbot builder for custom automation flows
- Supports 8+ AI providers with automatic fallback when one fails or rate-limits
- Lets users connect their WhatsApp/Instagram by simply logging into their Meta accounts (OAuth) — no token copying, no developer console navigation
- Lets users add their own AI API keys from providers they choose (OpenRouter, Groq, Cerebras, Mistral, Cohere, NVIDIA NIM, Gemini, xAI)
- Operates as a true multi-tenant system where every workspace is isolated and every user owns their data
- Deploys as a ready-to-use SaaS product on Render (backend) + Vercel (frontend) + Render PostgreSQL (database)

**The ultimate experience:** A user signs up → lands on a setup page → clicks "Connect WhatsApp" → logs into Meta → done. Clicks "Connect Instagram" → logs into Meta → done. Adds their preferred AI provider API keys → clicks "Deploy Automation" → the system starts auto-replying to every message intelligently. No CLI. No docker. No config files. Just sign up and go.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                     │
│              Next.js 16.1.6 + React 19                   │
│         https://signhify-crm.vercel.app                  │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ Landing  │ │  Login  │ │Register │ │   Privacy /  │  │
│  │  Page    │ │  Page   │ │  Page   │ │   Terms      │  │
│  └─────────┘ └─────────┘ └─────────┘ └──────────────┘  │
│                                                         │
│  ┌──────────────────── APP SHELL ─────────────────────┐  │
│  │  Sidebar: Dashboard, Inbox, Contacts, Pipeline,   │  │
│  │  Followups, Chatbot, AI, Templates, Team,         │  │
│  │  Settings, Webhooks, Automation, Setup             │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────┐ ┌────────────┐ ┌──────────────────────┐  │
│  │  Setup     │ │  Settings  │ │    Chatbot Builder   │  │
│  │  (OAuth +  │ │  (Reconnect│ │  (Visual Flow Editor)│  │
│  │  AI Keys)  │ │  Status)   │ │                      │  │
│  └───────────┘ └────────────┘ └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                    JWT Auth (Bearer)
                          │
┌─────────────────────────────────────────────────────────┐
│                BACKEND (Render)                          │
│           Node.js + Express + TypeScript                 │
│  https://whatsapp-crm-backend-bv1j.onrender.com         │
│                                                         │
│  ┌─── Auth ───┐  ┌─── OAuth ──┐  ┌─── AI Engine ────┐  │
│  │  JWT Login │  │ Meta OAuth │  │ 8 Providers +     │  │
│  │  Register  │  │ WhatsApp   │  │ Fallback Chain    │  │
│  │  Refresh   │  │ Instagram  │  │ Auto-Reply        │  │
│  │  Admin     │  │ Token Mgmt │  │ Smart Reply       │  │
│  └────────────┘  └────────────┘  │ Summarize         │  │
│                                  │ Lead Score        │  │
│  ┌─── CRM ────┐  ┌─── Chat ───┐  └──────────────────┘  │
│  │  Contacts  │  │  Inbox     │                         │
│  │  Pipeline  │  │  Messages  │  ┌─── Automation ────┐  │
│  │  Followups │  │  Templates │  │ AI Categorize     │  │
│  │  Notes     │  │  Typing    │  │ AI Prioritize     │  │
│  │  Search    │  │  Read      │  │ AI Auto-Assign    │  │
│  │  Analytics │  │  Receipts  │  │ AI Auto-Tag       │  │
│  │  Export    │  │  Webhooks  │  │ AI Auto-Reply     │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
│                                                         │
│  ┌─── Platform ─┐  ┌─── Team ───┐  ┌─── Webhooks ───┐  │
│  │  Workspace   │  │  Members   │  │  Incoming       │  │
│  │  Settings    │  │  Roles     │  │  Outgoing       │  │
│  │  API Keys    │  │  Invites   │  │  Logs           │  │
│  └──────────────┘  └────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                    Prisma ORM
                          │
┌─────────────────────────────────────────────────────────┐
│              DATABASE (Render PostgreSQL)                 │
│                                                         │
│  20+ Models: User, Workspace, WorkspaceMember,          │
│  WaAccount, IgAccount, Contact, Conversation, Message,  │
│  ReadReceipt, TypingIndicator, Followup, Template,      │
│  ContactNote, Autoresponder, WebhookLog, ChatbotFlow,   │
│  FlowNode, FlowEdge, FlowExecution, LeadScoringRule,    │
│  AiProvider, AiConversationSummary, AiAutoReplyLog,     │
│  VerificationToken                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 3. What Has Been Built (Complete Feature List)

### 3.1 Backend (29 Route Files)

| Category | Routes | Description |
|----------|--------|-------------|
| **Auth** | `auth.ts` | JWT login, register, token refresh |
| **OAuth** | `oauth.ts` | Meta OAuth for WhatsApp + Instagram (state token → code exchange → long-lived token) |
| **Admin** | `admin.ts` | `/api/v1/admin/setup` endpoint, DB push, seed (gated by `ADMIN_SECRET` + `ADMIN_ENABLED`) |
| **Contacts** | `contacts.ts` | Full CRUD, search, filtering, lead scoring |
| **Inbox** | `inbox.ts` | Unified inbox across channels |
| **Messages** | `messages.ts` | Send/receive, message history |
| **Templates** | `templates.ts` | Quick reply templates |
| **Followups** | `followups.ts` | Reminder/follow-up management |
| **Chatbot** | `chatbotFlows.ts` | Visual flow builder API (CRUD + execution) |
| **AI** | `ai.ts` | Provider management, auto-reply, summarize, lead-score |
| **Automation** | `automation.ts` | AI automation engine triggers |
| **Autoresponder** | `autoresponder.ts` | Keyword-triggered auto-replies |
| **Webhooks** | `webhooks.ts`, `webhooksLog.ts` | Webhook management and logging |
| **Analytics** | `analytics.ts` | Dashboard metrics, channel analytics |
| **Team** | `team.ts` | Workspace member management, roles |
| **Settings** | `settings.ts` | Workspace configuration |
| **Workspace** | `workspace.ts` | Workspace CRUD |
| **Realtime** | `realtime.ts`, `typing.ts`, `readReceipts.ts` | SSE events, typing indicators, read receipts |
| **Search** | `search.ts` | Global search across contacts/messages |
| **Activity** | `activity.ts` | Activity logging |
| **Notes** | `notes.ts` | Contact notes |
| **Media** | `media.ts` | Media upload handling |
| **Broadcast** | `broadcast.ts` | Bulk message sending |
| **Export** | `export.ts` | Data export |
| **Invite** | `invite.ts` | Team member invitations |
| **Scheduled** | `scheduledMessage.ts` | Scheduled message queue |
| **Verify** | `verify.ts` | Webhook verification |
| **Health** | `health.ts` | Health check endpoint |

### 3.2 AI System

**8 Providers with automatic fallback:**

| Provider | Base URL | Default Model |
|----------|----------|---------------|
| OpenRouter | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.1-8b-instruct:free` |
| Groq | `https://api.groq.com/openai/v1` | `llama3-8b-8192` |
| Cerebras | `https://api.cerebras.ai/v1` | `llama-3.1-8b` |
| Mistral | `https://api.mistral.ai/v1` | `mistral-tiny` |
| Cohere | `https://api.cohere.ai/v1` | `command` |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `meta/llama-3.1-8b-instruct` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-pro` |
| xAI | `https://api.x.ai/v1` | `grok-2` |

**AI Capabilities:**
- `autoReply(messages)` — Generate contextual auto-replies with fallback chain
- `smartReply(messages)` — Generate quick-reply suggestions
- `summarize(messages)` — Conversation summary with sentiment analysis
- `leadScore(contact, messages)` — AI-powered lead scoring

**AI Automation Engine (`processAutomation`):**
Runs on every inbound message:
1. AI auto-categorizes the message (support, sales, billing, general)
2. AI auto-prioritizes (urgent, high, medium, low)
3. AI auto-tags the contact
4. AI auto-assigns to team member based on workload/expertise
5. AI generates auto-reply (if enabled)
6. Logs everything to `AiAutoReplyLog`

### 3.3 Chatbot Flow Builder

**Visual flow editor with node types:**
- `start` — Entry point
- `end` — Termination
- `message` — Send a message
- `question` — Ask a question, wait for response
- `condition` — Branch based on keywords/conditions
- `action` — Perform an action (tag, assign, score)
- `ai_reply` — Generate AI response within flow

**6 Pre-built Templates:**
1. Welcome Bot — Greet new contacts
2. Support Triage — Categorize and route support tickets
3. Sales Qualifier — Qualify leads with questions
4. Booking Assistant — Schedule appointments
5. FAQ Bot — Answer common questions
6. Feedback Collector — Gather customer feedback

### 3.4 Frontend (15+ Pages)

| Page | Description |
|------|-------------|
| **Landing** (`/`) | SaaS marketing page with features, pricing, CTA |
| **Login** (`/login`) | Email/password login |
| **Register** (`/register`) | Account creation |
| **Privacy** (`/privacy`) | Privacy policy (Meta approval requirement) |
| **Terms** (`/terms`) | Terms of service |
| **Dashboard** (`/dashboard`) | Overview metrics, charts |
| **Inbox** (`/inbox`) | Unified WhatsApp + Instagram inbox |
| **Contacts** (`/contacts`) | Contact management with search/filter |
| **Pipeline** (`/pipeline`) | Kanban board (new → contacted → qualified → proposal → won/lost) |
| **Followups** (`/followups`) | Scheduled follow-up reminders |
| **Chatbot** (`/chatbot`) | Visual drag-and-drop flow builder |
| **AI** (`/ai`) | AI provider management (add/remove/configure API keys) |
| **Templates** (`/templates`) | Quick reply template management |
| **Team** (`/team`) | Team member management, roles, invitations |
| **Settings** (`/settings`) | OAuth connection status, reconnect/disconnect, workspace settings |
| **Webhooks** (`/webhooks`) | Webhook endpoint management |
| **Automation** (`/automation`) | AI automation dashboard — deploy one-click auto-reply |
| **Setup** (`/setup`) | **Key page** — OAuth buttons for WhatsApp/Instagram, AI API key configuration, one-click automation deployment |
| **Onboarding** (`/onboarding`) | Redirects to `/setup` |

### 3.5 Infrastructure

- **Multi-tenancy:** All data models (except User) scoped by `workspaceId`
- **JWT Authentication:** Tokens embed both `userId` and `workspaceId`
- **Legacy auth removed:** `extractAuth` (x-user-id headers) stripped from 18 route files — security vulnerability fixed
- **Admin endpoints protected:** Require `ADMIN_SECRET` + `ADMIN_ENABLED=true`
- **Hardcoded UUIDs fixed:** `useUnreadCounts.ts` and `useTypingIndicator.ts` now use dynamic auth context values
- **Idempotent seed:** Safe to re-run without duplicates

---

## 4. Deployment Configuration

### 4.1 Live Services

| Service | Platform | URL |
|---------|----------|-----|
| Backend API | Render | `https://whatsapp-crm-backend-bv1j.onrender.com` |
| Frontend | Vercel | `https://signhify-crm.vercel.app` |
| Database | Render PostgreSQL | (connection string in Render env) |

### 4.2 Render Service Details

**Backend Service ID:** `srv-d8rsalsvikkc738utad0`  
**Owner ID:** `tea-d7f6upa8qa3s73ess920`  
**API Key:** `rnd_1zdQu1FurbvwTTalFgUceUEdUX53`

**Build Command:** `npm install --include=dev && npx prisma generate && npm run build`  
**Start Command:** `node dist/server.js`  
**Health Check:** `/health`

### 4.3 Environment Variables (Backend)

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | *(from Render DB)* | PostgreSQL connection string |
| `DIRECT_URL` | *(from Render DB)* | Same as DATABASE_URL for PostgreSQL |
| `WA_VERIFY_TOKEN` | *(auto-generated)* | WhatsApp webhook verification |
| `IG_VERIFY_TOKEN` | *(auto-generated)* | Instagram webhook verification |
| `META_API_VERSION` | `v21.0` | Meta Graph API version |
| `JWT_SECRET` | *(auto-generated)* | JWT signing secret |
| `CORS_ORIGIN` | `https://signhify-crm.vercel.app` | Frontend origin |
| `PORT` | `3001` | Server port |
| `LOG_LEVEL` | `info` | |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15 minutes |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Per window |
| `META_APP_ID` | `980883078083935` | **Meta App ID (LIVE)** |
| `META_APP_SECRET` | `798886936e5226d9ff26608f511270cc` | **Meta App Secret (LIVE)** |
| `FRONTEND_URL` | `https://signhify-crm.vercel.app` | For OAuth redirect construction |
| `ADMIN_SECRET` | `crm-admin-setup-key-2026` | Admin endpoint access |
| `ADMIN_ENABLED` | `false` | Disabled in production |
| `OPENROUTER_API_KEY` | *(user-provided)* | Via setup page |
| `GROQ_API_KEY` | *(user-provided)* | Via setup page |
| `CEREBRAS_API_KEY` | *(user-provided)* | Via setup page |
| `MISTRAL_API_KEY` | *(user-provided)* | Via setup page |
| `COHERE_API_KEY` | *(user-provided)* | Via setup page |
| `NVIDIA_API_KEY` | *(user-provided)* | Via setup page |
| `GEMINI_API_KEY` | *(user-provided)* | Via setup page |
| `XAI_API_KEY` | *(user-provided)* | Via setup page |

### 4.4 Environment Variables (Frontend)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://whatsapp-crm-backend-bv1j.onrender.com/api/v1` |
| `NODE_ENV` | `production` |

### 4.5 Meta App Credentials (LIVE)

```
META_APP_ID=980883078083935
META_APP_SECRET=798886936e5226d9ff26608f511270cc
```

**OAuth Redirect URIs to configure in Meta Developer Console:**
- WhatsApp: `https://signhify-crm.vercel.app/api/v1/oauth/whatsapp/callback`
- Instagram: `https://signhify-crm.vercel.app/api/v1/oauth/instagram/callback`

**Privacy Policy URL (for Meta review):** `https://signhify-crm.vercel.app/privacy`

---

## 5. Database Schema (20+ Models)

All models except `User` are scoped by `workspaceId` for multi-tenancy.

| Model | Purpose |
|-------|---------|
| `User` | Account credentials, email, password |
| `Workspace` | Tenant container, plan (free/paid) |
| `WorkspaceMember` | User-workspace relationship with role |
| `WaAccount` | WhatsApp connection (phoneId, businessId, accessToken) |
| `IgAccount` | Instagram connection (igUserId, accessToken) |
| `Contact` | CRM contacts with tags, stage, leadScore, channel |
| `Conversation` | Thread per contact per channel |
| `Message` | Individual messages (inbound/outbound) |
| `TypingIndicator` | Real-time typing status |
| `ReadReceipt` | Message read tracking |
| `Followup` | Scheduled reminders |
| `Template` | Quick reply templates |
| `ContactNote` | Notes on contacts |
| `Autoresponder` | Keyword-triggered auto-replies |
| `WebhookLog` | Incoming webhook audit log |
| `ChatbotFlow` | Flow definitions |
| `FlowNode` | Nodes in a flow |
| `FlowEdge` | Edges connecting nodes |
| `FlowExecution` | Running flow instances |
| `LeadScoringRule` | Scoring rules |
| `AiProvider` | AI provider configs (per workspace) |
| `AiConversationSummary` | AI-generated summaries |
| `AiAutoReplyLog` | AI auto-reply audit trail |
| `VerificationToken` | Email verification tokens |

---

## 6. Git Commit History

```
3cce250 Add Privacy Policy and Terms pages for Meta app approval, update render.yaml
5761726 Add OAuth login for WhatsApp/Instagram, AI API key setup page, automation engine, chatbot templates
ea4b64d Fix Settings page auth, add WhatsApp/Instagram setup guides
bac2ec6 Temporarily enable admin endpoint for schema migration
2e24fa3 Fix security vulnerability, polish SaaS experience, add workspace limits
ce78950 docs: add comprehensive SETUP.md guide for new deployments
1a65626 fix: remove hardcoded UUIDs from hooks, protect admin endpoints
c1648d9 feat: add /api/v1/admin/setup endpoint for one-time DB init
24f7393 feat: add PostgreSQL migration for Render deployment
73db4eb fix: make seed idempotent for safe re-runs
5626028 fix: pin TypeScript 5.3.3 and remove ignoreDeprecations
91d738f fix: add ignoreDeprecations for TS5107 moduleResolution=node10
f4f1a18 fix: remove database type from render.yaml
b9516e9 fix: unignore render.yaml for Render Blueprint deployment
1986810 chore: Render deployment config + PostgreSQL schema sync
c2f3520 feat: complete WhatsApp+Instagram CRM with multi-provider AI integration
89d8b57 Fix TypeScript errors in frontend build
ad996e8 Enhance frontend hooks, real-time updates, and UI components
b3075a5 Initial commit including frontend and backend updates
b84b35c Fix: Add CORS debug logging
2040ed6 Fix: Correctly handle '*' wildcard in CORS origin
33dc437 Fix: Log descriptive strings instead of objects
14f926a Fix: Improve production console logging format
0c656d0 Fix: Add migrations to Railway startCommand
bd8bb30 Fix: Improve unhandled rejection logging
7ae397a Initial commit: WhatsApp CRM with backend and frontend
```

---

## 7. Remaining Work & Next Steps

### 7.1 Immediate (Meta App Approval)

1. **Meta Developer Console Setup:**
   - Go to https://developers.facebook.com/apps/create/
   - Create app with App ID `980883078083935`
   - Add WhatsApp and Instagram products
   - Configure OAuth redirect URIs (see Section 4.3)
   - Set Privacy Policy URL to `https://signhify-crm.vercel.app/privacy`
   - Submit app for review / take live

2. **Update Meta credentials on Render** (if not already done via API):
   - Set `META_APP_ID=980883078083935`
   - Set `META_APP_SECRET=798886936e5226d9ff26608f511270cc`

3. **Verify OAuth flow end-to-end:**
   - Test WhatsApp OAuth callback
   - Test Instagram OAuth callback
   - Verify long-lived token exchange works
   - Confirm webhook receives messages after connection

### 7.2 Short-Term Improvements

- [ ] **Terms of Service page content** — Page exists at `/terms` but needs legal review
- [ ] **Footer link audit** — Verify all landing page links work
- [ ] **Rate limiting for AI providers** — Add per-provider rate limiting to prevent abuse
- [ ] **Token refresh cron** — Auto-refresh Meta long-lived tokens before expiry
- [ ] **Email verification flow** — Currently unverified accounts can log in
- [ ] **Password reset flow** — No forgot-password functionality yet
- [ ] **WebSocket upgrade** — Replace SSE with WebSocket for bidirectional real-time

### 7.3 Medium-Term Features

- [ ] **Payment integration** — Stripe for paid plans (currently all free)
- [ ] **Multi-language support** — i18n for non-English users
- [ ] **Mobile responsive** — Currently desktop-first, needs mobile optimization
- [ ] **File/media attachments** — Send/receive images, documents, audio
- [ ] **Message search** — Full-text search within conversations
- [ ] **Conversation tags** — Tag conversations for organization
- [ ] **Internal notes** — Team-only notes on conversations
- [ ] **Agent collision detection** — Prevent multiple agents from replying to same message
- [ ] **Business hours** — Auto-reply only during business hours
- [ ] **Away messages** — Custom away messages outside business hours
- [ ] **CSAT surveys** — Post-conversation satisfaction surveys

### 7.4 Long-Term / Scaling

- [ ] **Migrate to Supabase** — Better free tier than Render PostgreSQL
- [ ] **Railway/Fly.io backend** — Better cold start behavior than Render free tier
- [ ] **CDN for media** — Cloudflare R2 or similar for media storage
- [ ] **Queue system** — Bull/BullMQ for job processing (broadcast, scheduled messages)
- [ ] **Caching layer** — Redis for session caching, rate limiting
- [ ] **Monitoring** — Sentry for error tracking, analytics for usage
- [ ] **API versioning** — `/api/v2/` for breaking changes
- [ ] **Webhook marketplace** — Let users connect external services
- [ ] **White-label option** — Custom branding for enterprise clients

---

## 8. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Next.js 16 + React 19** | Latest stable, SSR for landing page, API routes as backup |
| **Prisma ORM** | Type-safe DB access, migration system, works with PostgreSQL |
| **JWT (not sessions)** | Stateless auth, works across subdomains, easier scaling |
| **SSE (not WebSocket)** | Simpler implementation, sufficient for one-way real-time updates |
| **OAuth state tokens (JWT)** | Meta OAuth redirects lose Authorization headers; state tokens carry workspaceId through the redirect |
| **Multi-provider AI with fallback** | Free tiers have rate limits; fallback ensures availability |
| **Users provide own AI keys** | No cost to us, users choose their provider, no key management burden |
| **Render + Vercel** | Free tiers for MVP, easy deploy from GitHub, managed PostgreSQL |
| **`--include=dev` in build** | Prisma needs `@types/node` at build time; `--include=dev` ensures devDependencies are installed |
| **No `--data-proxy`** | Data Proxy client expects `prisma://` protocol; direct PostgreSQL needs plain `npx prisma generate` |

---

## 9. Critical Paths & Gotchas

### OAuth Flow (Meta)
1. User clicks "Connect WhatsApp" on `/setup`
2. Frontend calls `GET /api/v1/oauth/whatsapp` (authenticated)
3. Backend generates JWT state token containing `{workspaceId, userId, channel}`
4. Backend redirects to `https://www.facebook.com/v21.0/dialog/oauth?...&state={jwt}`
5. User logs into Meta, grants permissions
6. Meta redirects to `GET /api/v1/oauth/whatsapp/callback?code=...&state=...`
7. Backend verifies state token, extracts workspaceId
8. Backend exchanges code for short-lived token via `POST /graph.facebook.com/v21.0/oauth/access_token`
9. Backend exchanges short-lived for long-lived token via `GET /graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&...`
10. Backend fetches WhatsApp accounts via `GET /graph.facebook.com/v21.0/{business-id}/owned_whatsapp_business_accounts`
11. Backend stores tokens in `WaAccount` table
12. Backend redirects to `{FRONTEND_URL}/settings?whatsapp=connected`

### Admin Endpoint
- `POST /api/v1/admin/setup?secret=crm-admin-setup-key-2026` — Runs `prisma db push` + seed
- Only works when `ADMIN_ENABLED=true` (currently `false` in production)
- For first-time setup, temporarily set `ADMIN_ENABLED=true`, hit endpoint, then set back to `false`

### Build Failures (Historical)
- `TS5107 moduleResolution=node10 deprecated` → Fixed by pinning TypeScript to `5.3.3`
- `@types/express missing` → Fixed by adding `--include=dev`
- `Invalid value for ignoreDeprecations` → Fixed by removing it entirely
- Prisma `--data-proxy` breaking client → Fixed by using plain `npx prisma generate`

---

## 10. Repository Structure

```
CRM/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   │       └── 20260621000000_init_postgres/
│   │           └── migration.sql
│   └── src/
│       ├── server.ts
│       ├── prisma.ts
│       ├── env.ts
│       ├── ai/
│       │   ├── providers.ts
│       │   └── chain.ts
│       ├── services/
│       │   ├── chatbotEngine.ts
│       │   ├── leadScoring.ts
│       │   ├── aiAutomation.ts
│       │   └── chatbotTemplates.ts
│       ├── routes/          (29 files)
│       ├── whatsapp/
│       │   ├── meta.ts
│       │   ├── webhook.ts
│       │   └── graph.ts
│       ├── instagram/
│       │   ├── graph.ts
│       │   └── webhook.ts
│       ├── realtime/
│       │   └── events.ts
│       └── middleware/
│           ├── auth.ts
│           ├── security.ts
│           ├── logger.ts
│           └── limits.ts
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── middleware.ts
│   └── src/
│       ├── app/
│       │   ├── page.tsx              (landing)
│       │   ├── layout.tsx
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   ├── privacy/page.tsx
│       │   ├── terms/page.tsx
│       │   └── (app)/
│       │       ├── layout.tsx
│       │       ├── dashboard/page.tsx
│       │       ├── inbox/page.tsx
│       │       ├── contacts/page.tsx
│       │       ├── pipeline/page.tsx
│       │       ├── followups/page.tsx
│       │       ├── chatbot/page.tsx
│       │       ├── ai/page.tsx
│       │       ├── templates/page.tsx
│       │       ├── team/page.tsx
│       │       ├── settings/page.tsx
│       │       ├── webhooks/page.tsx
│       │       ├── automation/page.tsx
│       │       ├── onboarding/page.tsx
│       │       └── setup/page.tsx
│       ├── components/
│       │   ├── AppShell.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Topbar.tsx
│       │   └── ... (other components)
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── hooks/
│       │   ├── useUnreadCounts.ts
│       │   ├── useTypingIndicator.ts
│       │   ├── useRealtime.ts
│       │   └── ...
│       └── lib/
│           └── api.ts
├── render.yaml
├── SETUP.md
├── PROJECT_SUMMARY.md
├── PROJECT_CONTEXT.md       ← THIS FILE
└── README.md
```

---

## 11. Quick Reference Commands

```bash
# Local development
cd backend && npm run dev     # Backend on port 3001
cd frontend && npm run dev    # Frontend on port 3000

# First-time DB setup (production)
curl -X POST "https://whatsapp-crm-backend-bv1j.onrender.com/api/v1/admin/setup?secret=crm-admin-setup-key-2026"

# Render API — Update env var
curl -X PUT "https://api.render.com/v1/services/srv-d8rsalsvikkc738utad0/env-vars/META_APP_ID" \
  -H "Authorization: Bearer rnd_1zdQu1FurbvwTTalFgUceUEdUX53" \
  -H "Content-Type: application/json" \
  -d '{"value":"980883078083935"}'

# Git push
git add . && git commit -m "message" && git push origin master

# Type check
cd backend && npx tsc --noEmit
cd frontend && npx next build
```

---

*This document serves as the complete context for any AI assistant or developer continuing work on this project. It should be read in full before making any changes.*
