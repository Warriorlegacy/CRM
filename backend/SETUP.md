# 🚀 Final Setup - WhatsApp CRM Backend

## Quick Start (30 seconds)

```powershell
cd D:\CRM\whatsapp-crm\backend
.\emergency-fix.ps1
```

Then:
```bash
npm run dev
```

---

## What This Fixes

✅ **Removed all enums** - SQLite doesn't support them, converted to String fields  
✅ **Clean install** - Fresh node_modules  
✅ **SQLite database** - Single file, no PostgreSQL needed  
✅ **Auto-generated client** - Prisma client properly initialized  
✅ **Sample data** - Seeded with test users and contacts  

---

## Schema Changes for SQLite

| PostgreSQL | SQLite (Current) |
|------------|------------------|
| `enum MemberRole { admin, agent }` | `role String @default("agent")` |
| `enum ContactStage { new, followup, ... }` | `stage String @default("new")` |
| `enum ConversationStatus { open, closed }` | `status String @default("open")` |
| `enum MessageDirection { inbound, outbound }` | `direction String` |
| `enum MessageType { text, image, document }` | `type String @default("text")` |
| `enum FollowupStatus { pending, done }` | `status String @default("pending")` |
| `enum TypingStatus { typing, idle }` | `status String @default("idle")` |

**Valid values in your code:**
- `role`: `"admin"` or `"agent"`
- `stage`: `"new"`, `"followup"`, `"negotiation"`, `"won"`, `"lost"`
- `status`: `"open"`, `"closed"`
- `direction`: `"inbound"`, `"outbound"`
- `type`: `"text"`, `"image"`, `"document"`

---

## Test The Server

Once running (`npm run dev`):

```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return: {"ok":true}
```

---

## View Database

```bash
npx prisma studio
```

Opens at: http://localhost:5555

---

## Troubleshooting

**If you get "Cannot find module":**
```bash
npm install
npx prisma generate
```

**If database is corrupted:**
```bash
rm dev.db dev.db-journal
npx prisma migrate dev --name init
npx prisma db seed
```

**If migrations fail:**
```bash
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

---

## Next Steps

1. Start backend: `npm run dev` (Terminal 1)
2. Start frontend: `cd ../frontend && npm run dev` (Terminal 2)
3. Open browser: http://localhost:3000

**You're all set! 🎉**
