# Signhify CRM — Frontend

A full-featured, multi-channel Sales & Support CRM frontend built with **Next.js 16** (App Router), **TypeScript**, and **Tailwind CSS v4**.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework with Turbopack |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| Lucide React | Icon library |
| React Three Fiber | 3D hero scene |
| Framer Motion | Page transitions & animations |
| WebSocket | Real-time messaging & notifications |

## Pages

| Route | Page |
|---|---|
| `/` | Cinematic landing page with 3D hero |
| `/login` | Login with Google OAuth |
| `/register` | Register with Google OAuth |
| `/guide` | Non-technical user guide |
| `/dashboard` | Analytics dashboard with KPIs |
| `/inbox` | Multi-channel shared inbox |
| `/contacts` | Contact management with lead scoring |
| `/pipeline` | Drag-and-drop Kanban sales pipeline |
| `/followups` | Follow-up reminders |
| `/templates` | Message templates with variables |
| `/chatbot` | Visual chatbot flow builder |
| `/ai` | Multi-provider AI management (BYOK) |
| `/automation` | Automation rules |
| `/email-automation` | Email campaigns & automation |
| `/settings` | Workspace settings (7 tabs) |
| `/team` | Team member management |
| `/webhooks` | Webhook log viewer |
| `/notifications` | Real-time notification center |
| `/reports` | Deep-dive analytics & export |
| `/help` | Knowledge base & help center |
| `/import-export` | CSV import/export |
| `/setup` | Quick onboarding wizard |
| `/onboarding` | Full setup guide |

## Getting Started

```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

Requires the backend API running at `http://localhost:3001`.

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Build

```bash
npm run build    # Production build
npm run lint     # ESLint
```

## Deployment

```bash
vercel --prod    # Deploy to Vercel
```

---

**Built with ❤️ by Piyush Raj Singh**
