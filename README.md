# Signhify CRM

> **Transform WhatsApp & Instagram conversations into organized, repeatable revenue.**

Signhify CRM is a full-featured, multi-channel Sales & Support CRM built for the modern team. Connect WhatsApp Business and Instagram, manage a shared multi-agent inbox, automate follow-ups with AI, track leads through a visual pipeline, and close more deals — all from one dashboard.

**Live Demo:** [https://whatsapp-crm-frontend-three.vercel.app](https://whatsapp-crm-frontend-three.vercel.app)
**Backend API:** [https://whatsapp-crm-backend-one.vercel.app](https://whatsapp-crm-backend-one.vercel.app)

---

## ✨ Features

### 📬 Multi-Channel Shared Inbox
- Unified WhatsApp & Instagram inbox for your entire team
- Real-time message sync via WebSocket
- Conversation tagging with custom colors
- Internal notes with priority levels & team mentions
- Agent collision detection (prevents double replies)
- Media attachments (images, documents, audio)
- Read receipts & typing indicators
- Conversation locking

### 🧠 AI-Powered Automation
- **BYOK (Bring Your Own Key):** Connect any LLM provider — OpenAI, Anthropic, Groq, Gemini, DeepSeek, Together AI, OpenRouter, Mistral, Perplexity, SambaNova, Fireworks, Ollama, or any OpenAI-compatible custom endpoint
- **Multi-Provider Fallback Chain:** Automatically retries across your configured providers with circuit-breaker
- **AI Auto-Reply:** Smart replies, lead scoring, conversation summaries, language detection
- **Chatbot Flow Builder:** Visual drag-and-drop builder with 5 node types (Start, Message, Question, Condition, Action, End)
- **Smart Follow-ups:** AI-drafted replies and scheduled reminders

### 📊 Visual Sales Pipeline
- Drag-and-drop Kanban board (New → Contacted → Follow-up → Negotiation → Proposal → Won → Lost)
- Per-stage glow effects and contact counts
- Assign contacts to team members
- Bulk stage updates

### 👥 Team Collaboration
- Multi-agent workspaces with role-based access (Admin / Agent)
- Team performance leaderboard
- Real-time agent activity tracking
- Internal conversation notes with @mentions

### 📧 Email Campaigns & Automation
- Create & send HTML email campaigns
- SMTP configuration (Gmail, Outlook, custom)
- Email automation rules with triggers & conditions
- Campaign analytics (opens, clicks, delivery)

### 🔔 Follow-ups & Reminders
- Schedule follow-ups with due dates
- Overdue detection and priority flags
- Assigned-to tracking
- Status management (Pending / Done / Cancelled)

### 🤖 Automation
- Template-based auto-responders
- Keyword triggers with delay scheduling
- Business hours & away messages
- Multi-language AI support

### 📈 Analytics & Reporting
- Real-time dashboard with KPIs
- Team performance metrics
- Pipeline conversion funnel
- Lead scoring (hot/warm/cold/frozen)
- Channel breakdown (WhatsApp vs Instagram)
- Daily message trends
- Chatbot completion metrics
- Exportable reports (CSV)

### 🔐 Enterprise Security
- JWT authentication with refresh tokens
- Workspace-scoped data isolation
- Conversation locking
- Rate limiting & IP blocking
- Webhook signature verification
- CORS & CSP hardened

### 🌐 Public Pages
- Cinematic landing page with 3D hero scene
- Non-technical user guide (12-step walkthrough)
- SEO-optimized with sitemap & structured data

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
| Technology | Usage |
|---|---|
| **Next.js 16** (App Router) | React framework |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Utility-first styling |
| **Lucide React** | Icons |
| **React Three Fiber** | 3D hero scene |
| **Framer Motion** | Page animations |
| **WebSocket** | Real-time messaging |

**Backend**
| Technology | Usage |
|---|---|
| **Node.js + Express** | API server |
| **TypeScript** | Type safety |
| **Prisma ORM v5** | Database access |
| **PostgreSQL / SQLite** | Database |
| **WebSocket (ws)** | Real-time communication |
| **Zod** | Input validation |
| **JWT** | Authentication |

### Project Structure

```
whatsapp-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (SQLite)
│   │   ├── schema.railway.prisma  # Database schema (PostgreSQL)
│   │   ├── schema.sqlite.prisma   # Database schema (SQLite dev)
│   │   ├── seed.ts                # Sample data
│   │   └── migrate.ts             # Migration script
│   ├── src/
│   │   ├── server.ts              # Express app + server
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── env.ts                 # Environment config
│   │   ├── routes/
│   │   │   ├── activity.ts        # Activity feed
│   │   │   ├── admin.ts           # Admin setup
│   │   │   ├── ai.ts              # AI providers & chat
│   │   │   ├── analytics.ts       # Analytics endpoints
│   │   │   ├── auth.ts            # Auth (register, login, refresh)
│   │   │   ├── automation.ts      # Automation rules
│   │   │   ├── autoresponder.ts   # Auto-responders
│   │   │   ├── broadcast.ts       # Message broadcasts
│   │   │   ├── broadcasts.ts      # Broadcast management
│   │   │   ├── chatbotFlows.ts    # Chatbot flow builder
│   │   │   ├── contacts.ts        # Contact CRUD
│   │   │   ├── conversationLocks.ts # Lock/unlock conversations
│   │   │   ├── emailAutomation.ts # Email automation rules
│   │   │   ├── emailCampaigns.ts  # Email campaigns
│   │   │   ├── export.ts          # CSV export
│   │   │   ├── followups.ts       # Follow-up reminders
│   │   │   ├── health.ts          # Health checks
│   │   │   ├── inbox.ts           # Inbox management
│   │   │   ├── import.ts          # CSV import
│   │   │   ├── invite.ts          # Team invitations
│   │   │   ├── media.ts           # Media upload
│   │   │   ├── messages.ts        # Message sending
│   │   │   ├── notes.ts           # Conversation notes
│   │   │   ├── notifications.ts   # Real-time notifications
│   │   │   ├── oauth.ts           # Meta OAuth flow
│   │   │   ├── readReceipts.ts    # Read receipts
│   │   │   ├── realtime.ts        # SSE events
│   │   │   ├── scheduledMessage.ts # Scheduled messages
│   │   │   ├── search.ts          # Full-text search
│   │   │   ├── templates.ts       # Message templates
│   │   │   ├── typing.ts          # Typing indicators
│   │   │   ├── verify.ts          # Email verification
│   │   │   ├── webhooks.ts        # Meta webhooks
│   │   │   ├── webhooksLog.ts     # Webhook log viewer
│   │   │   └── workspace.ts       # Workspace management
│   │   ├── middleware/
│   │   │   ├── agentCollision.ts  # Collision detection
│   │   │   ├── auth.ts            # JWT verification
│   │   │   ├── businessHours.ts   # After-hours handling
│   │   │   ├── limits.ts          # Rate limits
│   │   │   ├── logger.ts          # Request logging
│   │   │   ├── security.ts        # Helmet, CORS, CSP
│   │   │   └── validation.ts      # Input validation
│   │   ├── services/
│   │   │   ├── activityTracker.ts # Agent activity tracking
│   │   │   ├── aiAutomation.ts    # AI auto-reply engine
│   │   │   ├── chatbotEngine.ts   # Chatbot execution
│   │   │   ├── chatbotTemplates.ts # Pre-built chatbot templates
│   │   │   ├── email.ts           # Email sending
│   │   │   ├── emailAutomation.ts # Email automation engine
│   │   │   └── leadScoring.ts     # Lead scoring engine
│   │   ├── ai/
│   │   │   ├── providers.ts       # LLM provider adapters
│   │   │   └── chain.ts           # Fallback chain logic
│   │   ├── instagram/
│   │   │   ├── graph.ts           # Instagram Graph API
│   │   │   ├── types.ts           # Instagram types
│   │   │   └── webhook.ts         # Instagram webhooks
│   │   ├── whatsapp/
│   │   │   ├── meta.ts            # WhatsApp Cloud API
│   │   │   └── webhook.ts         # WhatsApp webhooks
│   │   ├── realtime/
│   │   │   ├── events.ts          # Event pub/sub
│   │   │   └── websocket.ts       # WebSocket server
│   │   └── cron/
│   │       ├── autoresponse.ts    # Scheduled auto-replies
│   │       ├── emailCampaign.ts   # Campaign sending
│   │       └── tokenRefresh.ts    # Token refresh
│   ├── api/
│   │   └── index.ts               # Vercel serverless entry
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (app)/             # Authenticated app routes
    │   │   │   ├── ai/            # AI provider management
    │   │   │   ├── automation/    # Automation rules
    │   │   │   ├── chatbot/       # Chatbot flow builder
    │   │   │   ├── contacts/      # Contact management
    │   │   │   ├── dashboard/     # Analytics dashboard
    │   │   │   ├── email-automation/ # Email campaigns
    │   │   │   ├── followups/     # Follow-up reminders
    │   │   │   ├── help/          # Knowledge base
    │   │   │   ├── import-export/ # Data import/export
    │   │   │   ├── inbox/         # Multi-channel inbox
    │   │   │   ├── notifications/ # Notification center
    │   │   │   ├── onboarding/    # Setup wizard
    │   │   │   ├── pipeline/      # Kanban sales pipeline
    │   │   │   ├── reports/       # Deep-dive analytics
    │   │   │   ├── settings/      # Workspace settings
    │   │   │   ├── setup/         # Quick setup
    │   │   │   ├── team/          # Team management
    │   │   │   ├── templates/     # Message templates
    │   │   │   ├── webhooks/      # Webhook log viewer
    │   │   │   └── layout.tsx     # App shell layout
    │   │   ├── guide/             # Public user guide
    │   │   ├── login/             # Login page
    │   │   ├── register/          # Register page
    │   │   ├── page.tsx           # Landing page
    │   │   ├── layout.tsx         # Root layout
    │   │   ├── globals.css        # Global styles
    │   │   ├── sitemap.ts         # SEO sitemap
    │   │   └── robots.ts          # Robots.txt
    │   ├── components/
    │   │   ├── AppShell.tsx       # App shell (sidebar, topbar)
    │   │   ├── Sidebar.tsx        # Navigation sidebar
    │   │   ├── Topbar.tsx         # Top bar
    │   │   ├── StatCard.tsx       # Stat display card
    │   │   ├── Badge.tsx          # Status badges
    │   │   ├── ChannelBadge.tsx   # Channel indicator
    │   │   ├── GlobalSearch.tsx   # Global search
    │   │   ├── NotificationBadge.tsx # Badge counts
    │   │   ├── ShortcutsModal.tsx # Keyboard shortcuts
    │   │   ├── three/HeroScene.tsx # 3D landing hero
    │   │   └── ui/
    │   │       ├── Tabs.tsx       # Tab component
    │   │       ├── Toast.tsx      # Toast notifications
    │   │       ├── Button.tsx     # Button component
    │   │       ├── Card.tsx       # Card component
    │   │       └── Modal.tsx      # Modal component
    │   ├── contexts/
    │   │   ├── AuthContext.tsx     # Auth state
    │   │   └── NotificationContext.tsx # Toast notifications
    │   ├── hooks/
    │   │   ├── useRealtime.ts     # WebSocket hook
    │   │   ├── useMessages.ts     # Message fetching
    │   │   ├── useContacts.ts     # Contact management
    │   │   ├── useConversations.ts # Conversation management
    │   │   ├── useDashboard.ts    # Dashboard data
    │   │   ├── useFollowups.ts    # Follow-up management
    │   │   ├── useTemplates.ts    # Template management
    │   │   ├── useTypingIndicator.ts # Typing hook
    │   │   ├── useUnreadCounts.ts # Unread badge counts
    │   │   ├── useBrowserNotifications.ts # Desktop notifications
    │   │   ├── useNotificationSound.ts # Audio notifications
    │   │   ├── useKeyboardShortcuts.ts # Hotkeys
    │   │   └── useScrollReveal.ts # Scroll animations
    │   └── lib/
    │       ├── api.ts             # API client
    │       ├── constants.ts       # App constants
    │       ├── types.ts           # TypeScript types
    │       └── utils.ts           # Utility functions
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    └── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (recommended: 20 LTS)
- **PostgreSQL** (for production) or **SQLite** (for local dev)
- **Meta Developer Account** (for WhatsApp/Instagram API)

### 1. Clone & Install

```bash
git clone <repository-url>
cd whatsapp-crm

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
```

### 2. Database Setup

```bash
cd backend

# For SQLite (local dev - default)
npx prisma generate
npx prisma db push
npx prisma db seed

# For PostgreSQL (production)
# Edit schema.prisma to use postgres provider
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Run Development

```bash
# Terminal 1: Backend
cd backend
npm run dev    # Runs on http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev    # Runs on http://localhost:3000
```

---

## 📱 Connecting WhatsApp & Instagram

### OAuth Flow (1-Click — Recommended)
1. Go to **Settings → WhatsApp** or **Settings → Instagram**
2. Click **Connect with Meta**
3. Log in with your Facebook account
4. Grant the requested permissions
5. Webhook is automatically configured — no manual setup needed

### Manual Setup
1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create a Business App → Add WhatsApp product
3. Note: Phone Number ID, Business Account ID, Access Token
4. Configure webhook: `https://your-domain.com/webhook`
5. Subscribe to `messages` webhook field

---

## 🔗 API Overview

| Endpoint | Description |
|---|---|
| `GET /health` | Health check |
| `POST /api/v1/auth/register` | Create account |
| `POST /api/v1/auth/login` | Sign in |
| `GET /api/v1/inbox/conversations` | List conversations |
| `POST /api/v1/messages/send` | Send message |
| `GET /api/v1/contacts` | List contacts |
| `GET /api/v1/ai/providers` | Manage AI providers |
| `GET /api/v1/analytics` | Dashboard stats |
| `GET /api/v1/notifications` | Notifications |
| `POST /api/v1/import/contacts/csv` | Import contacts CSV |
| `GET /api/v1/export/contacts` | Export contacts |
| Full list: 40+ endpoints across 30 route files |

---

## 🌐 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```
- Environment: `NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api/v1`
- **Live at:** [https://whatsapp-crm-frontend-three.vercel.app](https://whatsapp-crm-frontend-three.vercel.app)

### Backend (Vercel)
```bash
cd backend
vercel --prod
```
- Entry: `api/index.ts` (serverless)
- Prisma client generated during build
- **Live at:** [https://whatsapp-crm-backend-one.vercel.app](https://whatsapp-crm-backend-one.vercel.app)

### Alternative Platforms
- **Railway / Render** — For Node.js + PostgreSQL deployment
- **Supabase** — Managed PostgreSQL with auto-scaling

---

## 🌟 Key Differentiators

| Feature | Signhify CRM | Others |
|---|---|---|
| **BYOK AI** | Bring any LLM key (OpenAI, Claude, DeepSeek, custom) | Vendor-locked AI |
| **Multi-Channel** | WhatsApp + Instagram in one inbox | WhatsApp-only |
| **Chatbot Builder** | Visual flow builder (no code) | Text-based config |
| **Real-time** | WebSocket (bi-directional) | SSE (server→client only) |
| **Pricing** | Free forever tier available | $50+/mo minimum |
| **1-Click Setup** | Embedded Meta OAuth | Manual webhook config |
| **AI Fallback** | Circuit-breaker across providers | Single provider |

---

## 🙏 Creator

**Piyush Raj Singh** — Solo Creator & Godfather of Signhify CRM

| Platform | Link |
|---|---|
| **Instagram** | [@piyushrajsingh.golu](https://www.instagram.com/piyushrajsingh.golu) |
| **LinkedIn** | [piyushraj-singh](https://linkedin.com/in/piyushraj-singh) |
| **GitHub** | [Warriorlegacy](https://github.com/Warriorlegacy) |
| **Studio** | [Signhify.dpdns.org](https://signhify.dpdns.org) |

---

## 📄 License

MIT License — free for anyone to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ in India 🇮🇳**

*"Type less. Signhify everything."*

</div>
