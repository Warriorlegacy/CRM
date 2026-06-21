# WhatsApp + Instagram CRM — Full Setup Guide

A production-ready CRM with unified WhatsApp & Instagram inbox, AI-powered auto-replies, chatbot flow builder, lead scoring, and team management.

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Frontend       │────▶│    Backend API        │────▶│   PostgreSQL     │
│   (Next.js)      │     │    (Express.js)       │     │   (Render DB)    │
│   Vercel         │     │    Render             │     │                  │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ┌─────▼─────┐     ┌──────▼──────┐
              │  WhatsApp  │     │  Instagram   │
              │  Meta API  │     │  Meta API    │
              └───────────┘     └─────────────┘
```

### Live URLs (Demo Deployment)
- **Frontend:** https://signhify-crm.vercel.app
- **Backend:** https://whatsapp-crm-backend-bv1j.onrender.com
- **Login:** `admin@rideright.in` / `Admin@123`

---

## Quick Start (New Deployment)

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed
- [Git](https://git-scm.com/) installed
- A [GitHub](https://github.com/) account
- A [Render](https://render.com/) account (free tier works)
- A [Vercel](https://vercel.com/) account (free tier works)
- A [Meta Developer](https://developers.facebook.com/) account (for WhatsApp/Instagram APIs)

### Step 1: Clone & Install

```bash
git clone https://github.com/Warriorlegacy/CRM.git
cd CRM

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Set Up Database (Render PostgreSQL)

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New+** → **PostgreSQL**
3. Configure:
   - **Name:** `crm-database`
   - **Plan:** Free
   - **Region:** Oregon (US West)
4. Click **Create Database**
5. Once created, copy the **Internal Database URL** (looks like `postgresql://user:pass@xxx.render.com:5432/dbname`)

### Step 3: Configure Backend Environment

Create `backend/.env`:

```bash
# Database
DATABASE_URL=your_postgresql_url_here
DIRECT_URL=your_postgresql_url_here

# Auth
JWT_SECRET=your-super-secret-key-at-least-32-chars
JWT_EXPIRES_IN=24h

# Webhook Verify Tokens (set these to anything random)
WA_VERIFY_TOKEN=your-whatsapp-verify-token
IG_VERIFY_TOKEN=your-instagram-verify-token

# Meta API
META_API_VERSION=v21.0

# CORS (set to your frontend URL)
CORS_ORIGIN=https://your-frontend.vercel.app

# Environment
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# AI Provider API Keys (at least one required)
OPENROUTER_API_KEY=sk-or-v1-...
GROQ_API_KEY=gsk_...
CEREBRAS_API_KEY=csk-...
MISTRAL_API_KEY=...
COHERE_API_KEY=...
NVIDIA_NIM_API_KEY=nvapi-...

# Admin (for initial setup only)
ADMIN_SECRET=your-admin-secret-key
```

### Step 4: Initialize Database

```bash
cd backend

# Push schema to database
npx prisma db push

# Seed with demo data (optional)
npx ts-node prisma/seed.ts
```

### Step 5: Configure Frontend Environment

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Step 6: Run Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open http://localhost:3000 and register a new account!

---

## Production Deployment

### Backend (Render)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → **New+** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name:** `whatsapp-crm-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install --include=dev && npx prisma generate && npm run build`
   - **Start Command:** `node dist/server.js`
   - **Plan:** Free (or Starter for production)
5. Add **Environment Variables** (same as Step 3, but with production values)
6. Click **Create Web Service**

### Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repo
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Add **Environment Variable:**
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api/v1`
5. Click **Deploy**

### Database Setup (Production)

After both services are deployed:

1. Visit `https://your-backend.onrender.com/api/v1/admin/setup?secret=your-admin-secret-key`
2. This pushes the schema and seeds demo data
3. **Remove the ADMIN_SECRET env var** after initial setup for security

---

## WhatsApp Integration

### Step 1: Create Meta App

1. Go to [Meta Developer Dashboard](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. Select **Business** type
4. Add **WhatsApp** product

### Step 2: Configure Webhook

1. In your Meta App → **WhatsApp** → **Configuration**
2. Under **Webhook**:
   - **Callback URL:** `https://your-backend.onrender.com/webhooks/whatsapp`
   - **Verify Token:** (use the same value as `WA_VERIFY_TOKEN` env var)
3. Click **Verify and Save**
4. Subscribe to events: `messages`, `messaging_postbacks`, `message_deliveries`

### Step 3: Get API Credentials

1. Go to **WhatsApp** → **API Setup**
2. Copy:
   - **Temporary Access Token** (or generate a permanent token)
   - **Phone Number ID**
   - **WhatsApp Business Account ID**

### Step 4: Connect in CRM

1. Open the CRM → **Settings** → **WhatsApp**
2. Enter:
   - Phone Number ID
   - Business Account ID
   - Access Token
3. Click **Connect**

---

## Instagram Integration

### Step 1: Configure in Meta App

1. In your Meta App → **Instagram** → **Basic Display**
2. Add **Webhooks**
3. Configure:
   - **Callback URL:** `https://your-backend.onrender.com/webhooks/instagram`
   - **Verify Token:** (use the same value as `IG_VERIFY_TOKEN` env var)
4. Subscribe to: `messages`, `messaging_postbacks`

### Step 2: Connect in CRM

1. Open the CRM → **Settings** → **Instagram**
2. Enter your Instagram Business Account credentials
3. Click **Connect**

---

## AI Auto-Reply Setup

The CRM supports multiple AI providers with automatic fallback. Configure at least one:

### Supported Providers (Free Tiers)

| Provider | Free Tier | Setup |
|----------|-----------|-------|
| OpenRouter | 100 req/day | Get key at [openrouter.ai](https://openrouter.ai) |
| Groq | 30 req/min | Get key at [console.groq.com](https://console.groq.com) |
| Cerebras | 30 req/min | Get key at [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| Mistral | 1 req/sec | Get key at [console.mistral.ai](https://console.mistral.ai) |
| Cohere | 1000 req/month | Get key at [cohere.com](https://cohere.com) |
| NVIDIA NIM | 1000 req/month | Get key at [build.nvidia.com](https://build.nvidia.com) |

### Configure in CRM

1. Open CRM → **AI** page
2. Add your API keys
3. Set provider priorities (drag to reorder)
4. Enable auto-reply for your workspace

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Yes | Same as DATABASE_URL for Render |
| `JWT_SECRET` | Yes | Secret key for JWT tokens (32+ chars) |
| `WA_VERIFY_TOKEN` | Yes | WhatsApp webhook verify token |
| `IG_VERIFY_TOKEN` | Yes | Instagram webhook verify token |
| `META_API_VERSION` | No | Default: `v20.0` |
| `CORS_ORIGIN` | Yes | Frontend URL (e.g., `https://your-app.vercel.app`) |
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Default: `3001` |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, `error` |
| `ADMIN_SECRET` | No | Secret key for admin endpoints |
| `OPENROUTER_API_KEY` | No | OpenRouter API key |
| `GROQ_API_KEY` | No | Groq API key |
| `CEREBRAS_API_KEY` | No | Cerebras API key |
| `MISTRAL_API_KEY` | No | Mistral API key |
| `COHERE_API_KEY` | No | Cohere API key |
| `NVIDIA_NIM_API_KEY` | No | NVIDIA NIM API key |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (e.g., `https://your-backend.onrender.com/api/v1`) |

---

## Default Accounts (Demo Seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@rideright.in` | `Admin@123` |
| Agent | `agent@rideright.in` | `Agent@123` |

**Change these passwords immediately in production!**

---

## API Endpoints

### Public (No Auth)
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/register` — Register new workspace
- `GET /health` — Health check
- `GET /webhooks/whatsapp` — WhatsApp webhook verification
- `POST /webhooks/whatsapp` — WhatsApp webhook receiver
- `GET /webhooks/instagram` — Instagram webhook verification
- `POST /webhooks/instagram` — Instagram webhook receiver

### Protected (JWT Bearer Token)
- `GET /api/v1/contacts` — List contacts
- `GET /api/v1/inbox` — Get conversations
- `POST /api/v1/messages` — Send message
- `GET /api/v1/templates` — List templates
- `GET /api/v1/followups` — List follow-ups
- `GET /api/v1/chatbot-flows` — List chatbot flows
- `GET /api/v1/ai/*` — AI endpoints
- `GET /api/v1/workspaces` — List workspaces
- `POST /api/v1/invite` — Invite team member

---

## Troubleshooting

### "Cannot find module" errors
```bash
cd backend
rm -rf node_modules
npm install
```

### Database connection errors
- Verify `DATABASE_URL` is correct
- Ensure Render PostgreSQL is running
- Check that your IP is not blocked (Render free tier has restrictions)

### Build failures on Render
- Check build logs in Render Dashboard
- Ensure `NODE_ENV=production` is set
- Verify all environment variables are configured

### CORS errors
- Ensure `CORS_ORIGIN` matches your frontend URL exactly
- Include `https://` protocol
- No trailing slash

---

## Customization

### Adding New Features
1. Create route in `backend/src/routes/`
2. Add Prisma model in `backend/prisma/schema.railway.prisma`
3. Run `npx prisma db push` to update database
4. Create frontend page in `frontend/src/app/(app)/`
5. Add navigation in `frontend/src/components/Sidebar.tsx`

### Changing Theme
- Edit `frontend/tailwind.config.ts`
- Modify color palette in `frontend/src/app/globals.css`

### Adding New AI Provider
1. Add adapter in `backend/src/ai/providers.ts`
2. Add API key env var
3. Update the AI settings page in `frontend/src/app/(app)/ai/page.tsx`

---

## License

Private — All rights reserved.
