# WhatsApp CRM Wrapper

A B2B SaaS platform that transforms WhatsApp into a proper Sales + Support CRM system.

## 🚀 Features

- **Team Inbox**: Shared WhatsApp number for your entire team
- **Lead Management**: Pipeline stages (New → Follow-up → Negotiation → Won → Lost)
- **Follow-ups**: Never miss a lead with scheduled reminders
- **Templates**: Quick replies with variables like {name}
- **Real-time Updates**: Live message sync using SSE (Server-Sent Events)
- **Multi-user Workspaces**: Admin and Agent roles

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lucide React (icons)

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- WhatsApp Cloud API (Meta)

**Real-time:**
- Server-Sent Events (SSE)

## 📁 Project Structure

```
whatsapp-crm/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── webhooks.ts
│   │   │   ├── realtime.ts
│   │   │   ├── inbox.ts
│   │   │   ├── messages.ts
│   │   │   ├── contacts.ts
│   │   │   ├── followups.ts
│   │   │   ├── templates.ts
│   │   │   └── workspace.ts
│   │   ├── whatsapp/
│   │   │   ├── meta.ts
│   │   │   └── webhook.ts
│   │   ├── realtime/
│   │   │   └── events.ts
│   │   ├── prisma.ts
│   │   ├── env.ts
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (app)/
    │   │   │   ├── inbox/
    │   │   │   ├── contacts/
    │   │   │   ├── pipeline/
    │   │   │   ├── followups/
    │   │   │   ├── templates/
    │   │   │   ├── team/
    │   │   │   ├── settings/
    │   │   │   └── layout.tsx
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components/
    │   │   ├── AppShell.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── Topbar.tsx
    │   │   ├── StatCard.tsx
    │   │   └── Badge.tsx
    │   ├── hooks/
    │   │   └── useRealtime.ts
    │   └── lib/
    │       └── api.ts
    ├── package.json
    └── next.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Meta Developer Account (for WhatsApp Cloud API)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd whatsapp-crm
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database URL and WhatsApp credentials

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database with sample data
npx prisma db seed

# Start development server
npm run dev
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📱 WhatsApp Cloud API Setup

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create a new app
3. Add WhatsApp product
4. Get your credentials:
   - Phone Number ID
   - Business Account ID (WABA ID)
   - Access Token
5. Configure webhook:
   - Callback URL: `https://your-domain.com/webhook`
   - Verify Token: Set in your `.env` file
   - Subscribe to `messages` events

## 🔌 API Endpoints

### Webhooks
- `GET /webhook` - WhatsApp verification
- `POST /webhook` - Receive WhatsApp messages

### Real-time
- `GET /realtime/events?workspaceId=` - SSE connection

### Inbox
- `GET /api/v1/inbox/conversations` - List conversations
- `GET /api/v1/inbox/conversations/:id/messages` - Get messages
- `PATCH /api/v1/inbox/conversations/:id/assign` - Assign chat
- `PATCH /api/v1/inbox/conversations/:id/stage` - Update stage

### Messages
- `POST /api/v1/messages/send` - Send WhatsApp message

### Contacts
- `GET /api/v1/contacts` - List contacts
- `POST /api/v1/contacts` - Create contact
- `PATCH /api/v1/contacts/:id` - Update contact

### Follow-ups
- `GET /api/v1/followups` - List follow-ups
- `POST /api/v1/followups` - Create follow-up
- `PATCH /api/v1/followups/:id/done` - Mark as done

### Templates
- `GET /api/v1/templates` - List templates
- `POST /api/v1/templates` - Create template
- `PATCH /api/v1/templates/:id` - Update template
- `DELETE /api/v1/templates/:id` - Delete template

### Workspace
- `GET /api/v1/workspaces` - List workspaces
- `POST /api/v1/workspaces` - Create workspace
- `GET /api/v1/workspaces/current` - Get current workspace
- `POST /api/v1/workspaces/wa-account` - Connect WhatsApp

## 💰 Pricing (India-friendly)

- **Starter**: ₹999/mo - 1 user, basic CRM
- **Pro**: ₹2999/mo - 3 users, follow-ups, reports
- **Business**: ₹6999/mo - 10 users, broadcasts, automation

## 🔒 Security

- Workspace-scoped data access
- Header-based auth (MVP - upgrade to JWT for production)
- Encrypted access tokens
- Webhook verification tokens

## 🚀 Deployment

### Backend (Render/Railway)
1. Set environment variables
2. Run `npx prisma migrate deploy`
3. Deploy Node.js app

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables
3. Deploy

## 📞 Support

For support, email support@whatsappcrm.com or join our WhatsApp community.

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ in India 🇮🇳
 
