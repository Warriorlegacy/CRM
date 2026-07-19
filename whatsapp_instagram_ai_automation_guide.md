# Master Guide: Automating WhatsApp & Instagram with AI (Free CRM Integration)

## Table of Contents

1. [Why Automate Client Chats](#why-automate-client-chats)
2. [Free Stack Overview](#free-stack-overview)
3. [Before You Begin](#before-you-begin)
4. [System Architecture](#system-architecture)
5. [Connect WhatsApp](#connect-whatsapp)
6. [Connect Instagram](#connect-instagram)
7. [Connect Your CRM](#connect-your-crm)
8. [Build AI Auto-Replies](#build-ai-auto-replies)
9. [Automate Leads and Follow-Ups](#automate-leads-and-follow-ups)
10. [Example n8n Workflow](#example-n8n-workflow)
11. [Master Final God-Level Autonomous Prompt](#master-final-god-level-autonomous-prompt)
12. [Troubleshooting and Best Practices](#troubleshooting-and-best-practices)
13. [Next Steps](#next-steps)

---

## Why Automate Client Chats

WhatsApp and Instagram are high-intent channels: prospects commonly message when they want pricing, availability, a portfolio, or a quick answer. Automation gives an immediate first response, captures lead data consistently, logs conversations in one place, and hands complex requests to a human.

For a freelancer or small business, the goal is **not** to replace sales conversations. It is to automate repetitive first-line work:

- Answer FAQs: pricing ranges, services, delivery times, availability
- Qualify leads: budget, deadline, service required, company name
- Create a CRM contact and deal automatically
- Send a booking link or project questionnaire
- Remind prospects who have not replied
- Escalate custom, urgent, or unhappy-client messages to a human

Meta's Instagram Messaging API allows professional accounts to send and receive customer messages through webhooks, but a customer must initiate the conversation first and the usual reply window is 24 hours.

---

## Free Stack Overview

| Layer | Recommended Free Option | Purpose |
|---|---|---|
| CRM | HubSpot Free | Contacts, deals, notes, tasks, pipelines |
| Automation | Self-hosted n8n (Docker) | Connect APIs, CRM, AI, Google Sheets, email |
| WhatsApp | WhatsApp Cloud API / whatsapp-web.js | Business messaging |
| Instagram | Instagram Graph/Messaging API | Receive and reply to Instagram DMs |
| AI | Ollama (local, free) or Gemini free tier | Intent detection and draft responses |
| Scheduling | Google Calendar + Calendly free | Appointment booking |
| Backup database | Google Sheets or Supabase free tier | Logs, FAQ content, failed-event queue |

> **Reality check:** "Free" means the software stack can start without a subscription. WhatsApp Business Platform messaging can still incur Meta fees for outbound templates at scale. For very small volumes, start with the WhatsApp Business app or whatsapp-web.js, then move to Cloud API as volume grows.

---

## Before You Begin

Prepare the following:

- A Meta Business Portfolio and Meta developer account
- A WhatsApp Business Account and a phone number dedicated to business messaging
- An Instagram **Professional** account (Business or Creator)
- A public HTTPS webhook URL, e.g. `https://yourdomain.com/webhook/meta`
- A HubSpot Free account
- A self-hosted n8n instance (Docker Desktop + n8n image, or a low-cost VPS)
- A local AI runtime (Ollama) or an AI provider API key
- A knowledge base: services, prices, FAQs, working hours, policies, portfolio links, booking URL

```env
META_VERIFY_TOKEN=replace_with_random_secret
WHATSAPP_TOKEN=replace_with_meta_access_token
INSTAGRAM_TOKEN=replace_with_instagram_access_token
HUBSPOT_TOKEN=replace_with_private_app_token
AI_API_KEY=replace_with_provider_key_or_leave_blank_for_ollama
```

---

## System Architecture

```text
Customer DM / WhatsApp message
        |
        v
Meta webhook / whatsapp-web.js
        |
        v
n8n webhook workflow
        |
        +--> Validate event and remove duplicates
        +--> Find/create HubSpot contact
        +--> Classify intent with AI (Ollama or API)
        +--> Retrieve FAQ / service information
        +--> Generate safe response
        +--> Send reply through WhatsApp/Instagram
        +--> Update deal, note, tags, and follow-up task
        |
        v
Human handoff when required
```

Standard lead schema:

```json
{
  "source": "instagram | whatsapp",
  "name": "",
  "phone": "",
  "instagram_id": "",
  "email": "",
  "service_interest": "",
  "budget_range": "",
  "deadline": "",
  "intent": "faq | quote | booking | support | human_handoff",
  "status": "new | qualified | follow_up | won | lost"
}
```

---

## Connect WhatsApp

**Option A — WhatsApp Cloud API (official, scalable):**
1. Create a Meta app, add the WhatsApp product.
2. Connect/create your WhatsApp Business Account and test number.
3. Generate a long-lived system-user access token.
4. Configure webhook callback URL and subscribe to `messages`.
5. In n8n, add a **Webhook** trigger at `/webhook/whatsapp` and verify using `META_VERIFY_TOKEN`.
6. Parse inbound messages and send replies via the WhatsApp phone-number endpoint.

**Option B — whatsapp-web.js (free, no Meta approval needed, small scale):**
1. Set up a Node.js project with the `whatsapp-web.js` library.
2. Run `node index.js`, scan the QR code once to link WhatsApp Web.
3. Expose a local `/send-message` endpoint that n8n calls to push AI-generated replies.

Use the official Cloud API for scaled business use; whatsapp-web.js is fine for early-stage/small-scale personal automation but carries a small risk if used for bulk/unsolicited messaging.

---

## Connect Instagram

1. Convert the Instagram account to **Professional**.
2. Create a Meta developer app and add the Instagram Messaging product.
3. Complete Meta Login/OAuth and request `instagram_business_manage_messages`.
4. Configure the same HTTPS webhook and subscribe to Instagram message events.
5. In n8n, route Instagram events to a dedicated branch and store the sender's scoped ID (`IGSID`) in HubSpot.
6. Send replies via the Instagram messages endpoint.

```bash
curl -X POST "https://graph.instagram.com/v22.0/<IG_ID>/messages" \
  -H "Authorization: Bearer <INSTAGRAM_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": { "id": "<IGSID>" },
    "message": { "text": "Thanks for messaging us. What service are you looking for?" }
  }'
```

---

## Connect Your CRM

Create these custom HubSpot contact properties:

- `lead_source`, `whatsapp_number`, `instagram_scoped_id`
- `service_interest`, `budget_range`, `deadline`
- `last_intent`, `last_channel`, `human_handoff_required`

Sequence after every inbound message:

1. Search contact by phone/Instagram ID.
2. Create contact if none exists.
3. Update contact with latest channel, intent, qualification data.
4. Create a deal when the customer asks for a quote, demo, or order.
5. Create a task when AI flags a high-value lead or handoff.
6. Add a note with a compact transcript and AI summary.

Pipeline stages:

```text
New Inquiry -> Qualified -> Meeting Booked -> Proposal Sent -> Won / Lost
```

---

## Build AI Auto-Replies

Rules before AI:

- `pricing` -> send approved pricing guide or qualifying question
- `availability` -> check calendar or send booking link
- `portfolio` -> send portfolio URL
- `human`, `complaint`, `refund`, `urgent` -> stop automation, notify owner
- unknown intent -> ask one concise clarifying question

Require structured AI output:

```json
{
  "intent": "quote",
  "confidence": 0.91,
  "lead_data": {
    "service_interest": "website development",
    "budget_range": "30k-50k",
    "deadline": "2 weeks"
  },
  "reply": "I can help with that. Is this a new website or a redesign?",
  "handoff_required": false
}
```

Safe response rules:

- Disclose automated chat where appropriate.
- Never invent prices, delivery times, guarantees, or policy exceptions.
- Ask at most one or two questions per response.
- Never request card, password, or government-ID details in chat.
- Escalate disputes, legal questions, refunds, abuse, and complex custom quotes.

---

## Automate Leads and Follow-Ups

```text
Inbound message
-> AI classifies "quote"
-> Create/update CRM contact
-> Create deal in "New Inquiry"
-> Send qualification questions
-> Customer replies with budget and deadline
-> Mark "Qualified"
-> Send calendar link
-> No reply after 24 hours?
-> Create owner task or send compliant follow-up
```

Follow-up policy:

- Follow up only with a valid business reason.
- Send one helpful reminder, not repeated messages.
- Stop immediately on opt-out.
- Respect Instagram's 24-hour reply window.
- Use approved templates for WhatsApp business-initiated messages when required.

---

## Example n8n Workflow

**Scenario:** A freelancer receives "What is the price for an ecommerce website?" on Instagram.

1. Webhook receives Meta Instagram message event.
2. Code node ignores delivery/read events and deduplicates by message ID.
3. HubSpot: find contact by `instagram_scoped_id`.
4. HubSpot: create contact if not found, source = Instagram.
5. AI node detects `pricing` intent and topic `ecommerce website`.
6. Switch node selects the approved FAQ response.
7. HTTP Request node replies via Instagram API with pricing range + one qualifier.
8. HubSpot creates a deal: "Instagram - Ecommerce website".
9. Wait node pauses 24 hours.
10. IF node creates a HubSpot task if there is no response, rather than sending an unapproved message.

---

## Master Final God-Level Autonomous Prompt

**Copy everything inside the code block below and paste it directly into your AI agent (ChatGPT, Claude, Gemini, or an n8n AI node). Replace all bracketed placeholders with your real business details before sending.**

```text
You are a senior AI automation engineer, n8n architect, CRM implementation
specialist, and Meta messaging API developer.

TASK
Design and generate a complete, production-aware automation for [BUSINESS NAME],
a [BUSINESS TYPE], to handle inbound WhatsApp and Instagram customer messages,
qualify leads, update a free CRM, and escalate cases to a human.

BUSINESS CONTEXT
- Services/products: [LIST]
- FAQ and approved prices: [PASTE FACTS ONLY]
- Booking URL: [URL]
- CRM: HubSpot Free
- Automation platform: self-hosted n8n
- AI option: [Ollama local model / Gemini free tier / other]
- Channels: WhatsApp (Cloud API or whatsapp-web.js) and Instagram Messaging API
- Human notification channel: [email / Telegram / Slack]
- Time zone: [TIME ZONE]
- Tone: [friendly, concise, professional]
- Handoff owner: [NAME OR TEAM]
- Prohibited claims: [LIST]

HARD CONSTRAINTS
1. Use only free tiers, self-hosted tools, or official APIs where possible.
2. Do not rely on paid Zapier, paid CRM plans, or unapproved bulk WhatsApp automation.
3. Treat all inbound webhook data as untrusted.
4. Include webhook verification, signature validation where available, idempotency
   using message IDs, retries with exponential backoff, timeout handling, and a
   dead-letter/error log using Google Sheets or Supabase.
5. Store tokens only as n8n credentials/environment variables; never hardcode them.
6. Respect Meta messaging limits and reply windows. Never propose spam or unsolicited
   bulk messaging.
7. Never let AI invent prices, availability, legal promises, refunds, or policies.
   Use only the approved knowledge base above; otherwise ask one clarifying question
   or escalate to a human.
8. Explicitly define human handoff triggers: "human", complaint, refund, urgent,
   payment dispute, legal request, abusive language, low confidence, and high-value lead.
9. Output concise, human-like replies. Ask no more than two questions at once.
10. Include a consent/privacy approach and a data-retention recommendation.

DELIVERABLE FORMAT
Output a Markdown implementation guide with exactly these sections:
1. Architecture diagram in Mermaid
2. Required accounts, credentials, environment variables, and CRM properties
3. Configuration steps for WhatsApp (Cloud API or whatsapp-web.js)
4. Configuration steps for Instagram Messaging API
5. HubSpot Free setup: custom properties, pipeline, task rules
6. n8n workflow node-by-node build instructions
7. Webhook payload normalization schema for both channels
8. AI system prompt for intent classification and safe response generation
9. JSON schema for AI output
10. Intent routing table: greeting, FAQ, pricing, availability, booking, quote,
    support, opt-out, complaint, and human handoff
11. Exact HTTP Request node configurations and example request bodies
12. Error handling, deduplication, retry, logging, and alert workflow
13. Test plan with at least 12 test cases
14. Launch checklist and monitoring metrics
15. A ready-to-import n8n workflow JSON skeleton, using placeholders instead of secrets

RULES
- Make reasonable assumptions only when explicitly labeled as an assumption.
- Begin with a minimal MVP workflow (greeting + pricing + booking only), then
  provide a scalable version with lead qualification and follow-ups.
- Do not omit any of the 15 sections above.
- Ask me clarifying questions first ONLY if critical business context above is
  missing; otherwise proceed directly to generating the full deliverable.
```

---

## Troubleshooting and Best Practices

| Problem | Likely Cause | Fix |
|---|---|---|
| Meta webhook fails verification | Callback URL not public HTTPS, or token mismatch | Use a public HTTPS URL and match the verify token exactly |
| AI replies twice | Meta retries webhook, no deduplication | Store each processed message ID before replying |
| CRM creates duplicate contacts | No unique lookup by phone/Instagram ID | Search first, create only if absent |
| Replies are incorrect | AI answers beyond approved facts | Restrict to approved FAQ data, use low-confidence handoff |
| Replies stop on Instagram | Reply window expired or user didn't initiate | Reply only within the eligible window; escalate otherwise |
| Costs rise unexpectedly | Excess outbound/template messaging | Limit proactive messaging, monitor Meta billing |
| WhatsApp number gets flagged | Bulk/unsolicited messaging via whatsapp-web.js | Only message opted-in contacts; avoid mass outreach |

For privacy compliance: publish a privacy notice, explain why lead data is collected, limit team access, define a data-retention period, and delete/export personal data on request.

---

## Next Steps

Launch an MVP with three intents: **greeting**, **pricing**, and **booking**. Confirm contacts, deals, and human handoffs are recording correctly in HubSpot before adding quote qualification, follow-ups, and a richer knowledge base. Test with your own accounts first, review every AI reply for the first week, then scale up automation gradually.
