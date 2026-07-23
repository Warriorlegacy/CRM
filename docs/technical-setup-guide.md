# Signhify CRM — Technical Setup Guide
## Facebook, WhatsApp, Instagram & Email Integration

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Meta App Configuration (Facebook Developer)](#2-meta-app-configuration)
3. [WhatsApp Business API Setup](#3-whatsapp-business-api-setup)
4. [Instagram Business API Setup](#4-instagram-business-api-setup)
5. [Email / SMTP Configuration](#5-email--smtp-configuration)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Webhook Verification](#7-webhook-verification)
8. [Testing & Validation](#8-testing--validation)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Before starting, ensure you have:

| Item | Required For | How to Get |
|------|-------------|------------|
| Meta Developer Account | All Meta integrations | [developers.facebook.com](https://developers.facebook.com) |
| WhatsApp Business Account (WABA) | WhatsApp messaging | Created via Meta Business Suite or WhatsApp Manager |
| Facebook Page | Instagram Business integration | [facebook.com/pages/create](https://facebook.com/pages/create) |
| Instagram Business/Creator Account | Instagram DM integration | Convert personal IG in Settings > Account > Switch to Professional |
| SMTP Credentials | Email campaigns | Gmail App Password, SendGrid, Mailgun, etc. |
| Supabase Project (Already Configured) | Database | `https://iynilxlxxhbutyentjcj.supabase.co` |
| Vercel Deployed Backend | Hosting Webhooks | `https://whatsapp-crm-backend-one.vercel.app` |
| Vercel Deployed Frontend | User Interface | `https://signhify-crm.vercel.app` |

---

## 2. Meta App Configuration

### 2.1 Create / Configure Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps** > **Create App**
3. Choose **Business** as the app type
4. Enter app name: `Signhify CRM`
5. Add email and save

### 2.2 Add Products to App

In your app dashboard:

1. **Dashboard** > Scroll to **Add Products**
2. Add **Facebook Login for Business**
3. Add **WhatsApp** (to send/receive messages)
4. Add **Instagram Basic Display** (for IG messaging)

### 2.3 Configure Facebook Login (OAuth)

1. Go to **Facebook Login** > **Settings**
2. Add OAuth Redirect URIs:
   ```
   https://whatsapp-crm-backend-one.vercel.app/api/v1/oauth/whatsapp/callback
   https://whatsapp-crm-backend-one.vercel.app/api/v1/oauth/instagram/callback
   http://localhost:3001/api/v1/oauth/whatsapp/callback
   http://localhost:3001/api/v1/oauth/instagram/callback
   ```
3. Add allowed domains for JavaScript SDK (if using FB Login on frontend):
   ```
   https://signhify-crm.vercel.app
   http://localhost:3000
   ```
4. Under **Business Login Config**, create or use an existing config:
   - Config ID: `1333150785194697`
   - Ensure **WhatsApp Business Messaging** permission is included in config scopes

### 2.4 Get App Credentials

1. Go to **Settings** > **Basic**
2. Copy **App ID**: `980883078083935`
3. Copy **App Secret**: `798886936e5226d9ff26608f511270cc`
4. These go into Vercel / Backend Environment Variables as `META_APP_ID` and `META_APP_SECRET`.

---

## 3. WhatsApp Business API Setup

### 3.1 Architecture Overview

```
┌─────────────┐     OAuth 2.0     ┌──────────────┐     Webhooks     ┌───────────┐
│  Frontend   │ ────────────────→  │   Backend    │ ←─────────────── │   Meta   │
│ (User Clicks│                   │ (Express API)│                  │   Graph  │
│ "Connect")  │ ←───────────────  │              │ ────────────────→│   API    │
└─────────────┘   Redirect back   └──────────────┘   Send Messages  └───────────┘
```

### 3.2 Create WhatsApp Business Account

1. Go to [business.facebook.com/wa/manage](https://business.facebook.com/wa/manage)
2. Click **Get Started** under WhatsApp
3. Follow prompts to create your WABA
4. Add a phone number (can be a virtual number from Twilio or a real SIM)
5. Verify the phone number via SMS/call

### 3.3 Get Your WABA Details

Once WABA is created:

1. In Meta App Dashboard > **WhatsApp** > **API Setup**
2. Copy **Phone Number ID** (e.g., `123456789012345`)
3. Copy **Business Account ID** (e.g., `987654321098765`)
4. A temporary access token is shown (for testing only)

### 3.4 Configure WhatsApp Webhook (via OAuth Flow)

The backend handles the OAuth flow automatically:

1. User visits `https://signhify-crm.vercel.app/setup`
2. Clicks **Connect WhatsApp**
3. Redirected to Meta OAuth dialog
4. User grants `whatsapp_business_messaging` and `whatsapp_business_management` permissions
5. Backend exchanges auth code for long-lived access token
6. Backend stores phone number, business account ID, and token in `WaAccount` table
7. Backend generates a `webhookVerifyToken` (uuid) and stores it

### 3.5 Register Webhook URL in Meta App

After OAuth flow completes, you must register the webhook URL:

1. Go to **Meta App Dashboard** > **WhatsApp** > **Configuration**
2. Under **Webhook**, click **Edit**
3. Set **Callback URL** to:
   ```
   https://whatsapp-crm-backend-one.vercel.app/webhook
   ```
4. Set **Verify Token** to the value in `.env` → `WA_VERIFY_TOKEN`
   - Current value: `910689484803820|jrvuQD3LmHHrfIvgEKhJAFyZOCE`
5. Under **Webhook Fields**, subscribe to:
   - `messages` *(Note: In Meta API v20.0+, `messages` automatically includes inbound messages, delivery receipts (`delivered`), read receipts (`read`), and error statuses)*
   - `message_template_status_update` (optional, for template approvals)
6. Click **Verify and Save**.

### 3.6 Send Messages (Backend Code)

The backend sends WhatsApp messages via `whatsapp/meta.ts`:

```typescript
// POST https://graph.facebook.com/v20.0/{phone-number-id}/messages
{
  "messaging_product": "whatsapp",
  "to": "91XXXXXXXXXX",
  "type": "text",
  "text": { "body": "Hello from Signhify CRM!" }
}
```

Headers: `Authorization: Bearer {long-lived-access-token}`

### 3.7 Webhook Processing Flow

When Meta sends a webhook event:

1. `GET /webhook` — Meta verification challenge
2. `POST /webhook` — Inbound message payload
3. Backend extracts: `from` (sender phone), `bodyText`, `waMessageId`, `type`
4. **Upserts** Contact by `workspaceId + phone`
5. **Upserts** Conversation by `workspaceId + contactId`
6. **Creates** Message record with `direction: 'inbound'`
7. **Publishes** real-time WebSocket event to frontend
8. **Creates** Notification (`inbound_message`)
9. **Processes** autoresponders (keyword/away/new-contact)
10. **Processes** chatbot flows
11. **Evaluates** lead scoring rules
12. **Triggers** AI automation (auto-reply/analysis)

---

## 4. Instagram Business API Setup

### 4.1 Prerequisites for Instagram API

- **Instagram Business/Creator Account** (not Personal)
- **Facebook Page** connected to the Instagram account
- **Meta App** with Instagram Basic Display product added

### 4.2 Convert Instagram to Business/Creator

1. Open Instagram app
2. Go to **Settings** > **Account** > **Switch to Professional Account**
3. Choose **Business** or **Creator**
4. Connect to your Facebook Page during setup

### 4.3 OAuth Flow for Instagram

Same as WhatsApp OAuth but with different scopes:

```typescript
// Scopes requested:
const scopes = [
  'instagram_basic',
  'instagram_manage_messages',
  'pages_messaging',
  'pages_show_list',
].join(',');
```

Flow:
1. User clicks **Connect Instagram** on setup page
2. Backend builds Meta OAuth URL with Instagram scopes
3. User authorizes → Meta redirects to callback
4. Backend exchanges code → short-lived token → long-lived token
5. Fetches Facebook Pages, finds linked Instagram Business Account
6. Stores IG details in `IgAccount` table

### 4.4 Register Instagram Credentials & Webhook

1. Go to **Meta App Dashboard** > **Instagram** > **API setup with Instagram business login**
2. Note **Instagram App Credentials**:
   - **Instagram App Name**: `SIGNHIFY-CRM-IG`
   - **Instagram App ID**: `1029450522875815`
   - **Instagram App Secret**: `62b7dec7f80364836d9e5f96018f2c4b`
3. Under **Configure webhooks**, set **Callback URL** to:
   ```
   https://whatsapp-crm-backend-one.vercel.app/webhook/instagram
   ```
   *(Note: You can also use `https://whatsapp-crm-backend-one.vercel.app/webhook` after deploying the updated backend)*
4. Set **Verify Token**:
   ```
   910689484803820|jrvuQD3LmHHrfIvgEKhJAFyZOCE
   ```
   *(Matches `IG_VERIFY_TOKEN` in Vercel Environment Variables)*
5. Under **Webhook Fields**, ensure the following fields are subscribed:
   - `messages`, `comments`, `live_comments`, `message_edit`, `message_reactions`, `messaging_handover`, `messaging_optins`, `messaging_postbacks`, `messaging_referral`, `messaging_seen`, `standby`
6. Click **Verify and Save**.
7. Under **3. Set up Instagram business login**, click **Set up** and enter **Redirect URL**:
   ```
   https://whatsapp-crm-backend-one.vercel.app/api/v1/oauth/instagram/callback
   ```
   Click **Save**.

### 4.5 Instagram Webhook Processing

Identical pattern to WhatsApp processing:
1. Parse inbound message from IG payload
2. Upsert contact (phone stored as `ig_{senderId}` for uniqueness)
3. Upsert conversation
4. Create message with `igMessageId`
5. Publish real-time event
6. Process autoresponders, chatbot flows, lead scoring, AI automation

### 4.6 Send Instagram Reply

Backend sends replies via `instagram/graph.ts`:

```typescript
// POST https://graph.facebook.com/v20.0/{ig-user-id}/messages
{
  "recipient": { "id": "{sender-ig-id}" },
  "message": { "text": "Hello from Signhify CRM!" },
  "messaging_type": "RESPONSE"
}
```

---

## 5. Email / SMTP Configuration

### 5.1 SMTP Providers Supported

| Provider | Host | Port | Security |
|----------|------|------|----------|
| Gmail | smtp.gmail.com | 587 | STARTTLS |
| Gmail (SSL) | smtp.gmail.com | 465 | SSL |
| SendGrid | smtp.sendgrid.net | 587 | STARTTLS |
| Mailgun | smtp.mailgun.org | 587 | STARTTLS |
| Outlook | smtp.office365.com | 587 | STARTTLS |
| Custom | any | any | any |

### 5.2 Get Gmail App Password (Recommended)

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App Passwords** (search in Google Account settings)
4. Select **Mail** and your device
5. Copy the 16-character app password

### 5.3 Configure SMTP in Signhify CRM

Per-workspace SMTP config via the **Settings** page:

| Field | Description | Example |
|-------|-------------|---------|
| Host | SMTP server hostname | `smtp.gmail.com` |
| Port | SMTP server port | `587` |
| Secure | Use SSL (465) or TLS (587) | `false` (for 587) |
| User | SMTP username (full email) | `piyush@example.com` |
| Pass | SMTP password (or App Password) | `xxxx xxxx xxxx xxxx` |
| From Name | Display name on sent emails | `Piyush from Signhify` |
| From Email | Sender email address | `piyush@signhify.com` |

SMTP config is stored per-workspace in the `SmtpConfig` table.

### 5.4 Email Campaign Architecture

```
┌───────────┐    Create Campaign    ┌──────────────┐    SMTP Send    ┌──────────┐
│  Frontend │ ───────────────────→  │   Backend    │ ──────────────→│  SMTP    │
│ UI        │                       │ Email Service │                │  Server  │
└───────────┘                       └──────────────┘                └──────────┘
       ↑                                   │
       │    Status Tracking                 │   Logs to
       │    (sent/opened/clicked)           │   EmailLog table
       └───────────────────────────────────┘
```

- Campaigns are created as `draft`, then sent
- Recipients are filtered by `recipientFilter` (JSON/string query)
- Each recipient gets an `EmailLog` entry
- Support for scheduled sending (`scheduledAt`)
- Automation rules trigger on events (new contact, message received, etc.)

### 5.5 Email Automation Rules

Rules trigger automated emails based on events:

| Trigger | Description |
|---------|-------------|
| `new_contact` | When a contact is first created |
| `stage_change` | When contact stage changes (e.g., new → followup) |
| `inbound_message` | When a new message is received |
| `followup_due` | When a followup is due |
| `lead_score` | When lead score crosses a threshold |

---

## 6. Environment Variables Reference

### 6.1 Backend & Vercel Environment Variables (`backend/.env` / Vercel Settings)

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `postgresql://...:6543/postgres?pgbouncer=true` | Transaction pooler for queries |
| `DIRECT_URL` | `postgresql://...:5432/postgres` | Session pooler for migrations |
| `SUPABASE_URL` | `https://iynilxlxxhbutyentjcj.supabase.co` | Supabase REST/Realtime client |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Public Supabase API key |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | Secret Supabase API key |
| `WA_VERIFY_TOKEN` | `910689484803820\|jrvuQD3LmHHrfIvgEKhJAFyZOCE` | WhatsApp webhook verify token |
| `IG_VERIFY_TOKEN` | `910689484803820\|jrvuQD3LmHHrfIvgEKhJAFyZOCE` | Instagram webhook verify token |
| `META_API_VERSION` | `v20.0` | Facebook Graph API version |
| `META_APP_ID` | `980883078083935` | Meta / Facebook App ID |
| `META_APP_SECRET` | `798886936e5226d9ff26608f511270cc` | Meta / Facebook App Secret |
| `INSTAGRAM_APP_ID` | `1029450522875815` | Instagram App ID |
| `INSTAGRAM_APP_SECRET` | `62b7dec7f80364836d9e5f96018f2c4b` | Instagram App Secret |
| `META_CONFIG_ID` | `1333150785194697` | Business Login Config ID |
| `BACKEND_URL` | `https://whatsapp-crm-backend-one.vercel.app` | Backend public URL for redirects |
| `FRONTEND_URL` | `https://signhify-crm.vercel.app` | Frontend URL for redirects |
| `GOOGLE_CLIENT_ID` | (empty - configure as needed) | Google OAuth Client ID |
| `JWT_SECRET` | `whatsapp_crm_super_secret_key_2024_32chars` | JWT signing secret |
| `CORS_ORIGIN` | `http://localhost:3000,https://signhify-crm.vercel.app` | Allowed CORS origins |
| `SMTP_HOST*` | `smtp.gmail.com` | Global SMTP host (fallback) |
| `SMTP_USER*` | `user@gmail.com` | Global SMTP user (fallback) |
| `SMTP_PASS*` | App password | Global SMTP pass (fallback) |

*Used as fallback when no per-workspace SmtpConfig exists.

#### Copy-Paste Block for Vercel Environment Variables (Backend Project):
```env
META_APP_ID=980883078083935
META_APP_SECRET=798886936e5226d9ff26608f511270cc
INSTAGRAM_APP_ID=1029450522875815
INSTAGRAM_APP_SECRET=62b7dec7f80364836d9e5f96018f2c4b
WA_VERIFY_TOKEN=910689484803820|jrvuQD3LmHHrfIvgEKhJAFyZOCE
IG_VERIFY_TOKEN=910689484803820|jrvuQD3LmHHrfIvgEKhJAFyZOCE
META_CONFIG_ID=1333150785194697
META_API_VERSION=v20.0
BACKEND_URL=https://whatsapp-crm-backend-one.vercel.app
FRONTEND_URL=https://signhify-crm.vercel.app
```

### 6.2 Frontend (`frontend/.env.local`)

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | `https://whatsapp-crm-backend-one.vercel.app/api/v1` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | (your Google client ID) | Google One Tap login |

---

## 7. Webhook Verification

### 7.1 Verify WhatsApp Webhook is Active

```bash
curl -s "https://whatsapp-crm-backend-one.vercel.app/webhook?hub.mode=subscribe&hub.verify_token=910689484803820|jrvuQD3LmHHrfIvgEKhJAFyZOCE&hub.challenge=test123"
```
Expected response: `test123`

### 7.2 Verify Instagram Webhook is Active

```bash
curl -s "https://whatsapp-crm-backend-one.vercel.app/webhook/instagram?hub.mode=subscribe&hub.verify_token=910689484803820|jrvuQD3LmHHrfIvgEKhJAFyZOCE&hub.challenge=test123"
```
Expected response: `test123`

### 7.3 Verify API Health

```bash
curl -s "https://whatsapp-crm-backend-one.vercel.app/health"
```
Expected response: `200 OK`

### 7.4 Verify OAuth Status

```bash
curl -s "https://whatsapp-crm-backend-one.vercel.app/api/v1/oauth/status" \
  -H "Authorization: Bearer {jwt-token}"
```
Expected response: JSON with `whatsapp.connected` and `instagram.connected` booleans.

---

## 8. Testing & Validation

### 8.1 Test WhatsApp Flow

1. Open Signhify CRM → click **Connect WhatsApp**
2. Complete Meta OAuth in browser popup
3. After redirect back, verify `WaAccount` table has a row
4. Send a WhatsApp message to your business number
5. Check backend logs for webhook receipt
6. Verify Contact, Conversation, and Message records created
7. Check frontend inbox for the new message

### 8.2 Test Instagram Flow

1. Click **Connect Instagram** in setup
2. Complete Meta OAuth (may need a Facebook Page with IG Business linked)
3. Send a DM to your Instagram Business account
4. Verify same pipeline as WhatsApp

### 8.3 Test Email Campaign

1. Configure SMTP in workspace settings
2. Create a test campaign via Campaigns page
3. Use **Send Test** with your own email
4. Verify email received in inbox
5. Full campaign: set recipient filter → click **Send**

### 8.4 Webhook Echo Test with ngrok (Local Dev)

```bash
# Start ngrok
ngrok http 3001

# Update webhook URLs in Meta App to ngrok URL
# https://{ngrok-id}.ngrok.io/webhook
# https://{ngrok-id}.ngrok.io/webhook/instagram
```

---

## 9. Troubleshooting

### 9.1 OAuth Fails / Redirect Loop

```
Symptom: After Meta OAuth, redirected back to /login instead of /setup
Cause: JWT token not passed correctly in OAuth redirect
Fix: Ensure frontend calls POST /api/v1/oauth/establish before OAuth redirect
```

### 9.2 Webhook Not Receiving Messages

```
Symptom: Meta sends messages but backend shows no POST to /webhook
Checks:
1. Verify webhook URL is accessible (GET returns 200 on verify)
2. Check WA_VERIFY_TOKEN matches what's in Meta App Dashboard
3. Check Vercel deployment logs for 4xx/5xx
4. Confirm webhook fields are subscribed (messages, message_deliveries)
```

### 9.3 Token Expired / Invalid

```
Symptom: Sending message returns "Invalid OAuth 2.0 Access Token"
Fix: Backend has auto-refresh via /api/v1/oauth/refresh (POST)
Or: Manual reconnection via setup page (disconnect → reconnect)
Long-lived tokens expire in 60 days, refresh extends by 60 days each time
```

### 9.4 Instagram Not Connected After OAuth

```
Symptom: Instagram says connected but callback shows "no_accounts"
Cause: Facebook Page not linked to Instagram Business Account
Fix: 
1. Ensure IG account is Business/Creator (not Personal)
2. Ensure IG is connected to a Facebook Page
3. The page must be associated with your Meta App
4. User must have admin role on the page
```

### 9.5 SMTP / Email Sending

```
Symptom: Test email fails with "Invalid login"
Checks:
1. For Gmail: Use App Password (not regular password)
2. Ensure 2FA is enabled (required for App Passwords)
3. Check port: 587 (STARTTLS) not 465 (SSL) unless secure=true
4. Some providers (Outlook) block "less secure apps"
5. Check Vercel backend allows outbound connections on SMTP port
```

### 9.6 Database Issues

```
Symptom: 500 errors on data operations
Checks:
1. Run migration SQL (supabase-migration.sql) in Supabase SQL Editor
2. Verify all 37 tables exist
3. Check Supabase connection pool isn't exhausted
4. Verify DIRECT_URL and DATABASE_URL are correct (swap if needed)
```

---

## Appendix: API Routes Reference

### Meta OAuth Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/oauth/establish` | Set OAuth context cookie |
| GET | `/api/v1/oauth/whatsapp` | Start WhatsApp OAuth |
| GET | `/api/v1/oauth/whatsapp/callback` | WhatsApp OAuth callback |
| GET | `/api/v1/oauth/instagram` | Start Instagram OAuth |
| GET | `/api/v1/oauth/instagram/callback` | Instagram OAuth callback |
| POST | `/api/v1/oauth/refresh` | Refresh access token |
| GET | `/api/v1/oauth/status` | Get connection status |
| DELETE | `/api/v1/oauth/disconnect/:channel` | Disconnect channel |

### Webhook Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/webhook` | WhatsApp webhook verification |
| POST | `/webhook` | WhatsApp inbound messages |
| GET | `/webhook/instagram` | Instagram webhook verification |
| POST | `/webhook/instagram` | Instagram inbound DMs |

### Email Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/email-campaigns` | List campaigns |
| POST | `/api/v1/email-campaigns` | Create campaign |
| GET | `/api/v1/email-campaigns/:id` | Get campaign details |
| POST | `/api/v1/email-campaigns/:id/send` | Send campaign |
| POST | `/api/v1/email-campaigns/send-test` | Send test email |
| PATCH | `/api/v1/email-campaigns/:id` | Update campaign |
| DELETE | `/api/v1/email-campaigns/:id` | Delete campaign |
| GET | `/api/v1/email-automation` | List automation rules |
| POST | `/api/v1/email-automation` | Create automation rule |

### Key Data Models

```prisma
// WhatsApp Account
model WaAccount {
  workspaceId        String   @unique
  phoneNumberId      String   // Meta phone number ID
  businessAccountId  String   // WABA ID
  accessToken        String   // Long-lived user token
  webhookVerifyToken String   // Generated per-workspace
}

// Instagram Account
model IgAccount {
  workspaceId        String   @unique
  igUserId           String   // Instagram Business Account ID
  accessToken        String   // Long-lived user token
  webhookVerifyToken String   // Generated per-workspace
}

// SMTP Config
model SmtpConfig {
  workspaceId String   @unique
  host        String   // smtp.gmail.com
  port        Int      // 587
  secure      Boolean  // false
  user        String   // email address
  pass        String   // app password
  fromName    String?
  fromEmail   String?
  isVerified  Boolean  // test send succeeded
}
```

---

*Document version 1.0 — Signhify CRM FB/WA/IG/Email Integration*
*For support: Contact Piyush Raj Singh*
