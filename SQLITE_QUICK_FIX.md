# Quick Fix: Use SQLite Instead of PostgreSQL

Since PostgreSQL isn't running, you can use **SQLite** which requires no setup!

## 🚀 Quick Fix (30 seconds)

```powershell
cd D:\CRM\whatsapp-crm\backend

# Backup PostgreSQL schema
copy prisma\schema.prisma prisma\schema.postgres.prisma

# Use SQLite schema
copy prisma\schema.sqlite.prisma prisma\schema.prisma

# Update config for SQLite
(@'
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: "file:./dev.db",
  },
});
'@) | Set-Content prisma.config.ts

# Install better-sqlite3
npm install better-sqlite3

# Run migrations
npx prisma migrate dev --name init

# Generate client
npx prisma generate

# Seed database
npx prisma db seed

# Start server
npm run dev
```

## ✅ That's it! No PostgreSQL needed!

SQLite stores everything in a single file (`dev.db`) and works great for development.

## 🔄 To Switch Back to PostgreSQL Later

```powershell
copy prisma\schema.postgres.prisma prisma\schema.prisma

# Update prisma.config.ts with PostgreSQL URL
# Run: npx prisma migrate dev
```

## 📋 Alternative: Install PostgreSQL

If you want PostgreSQL, download from: https://www.postgresql.org/download/windows/

Or use Docker:
```bash
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

---

**Recommendation:** Use SQLite for now to get started quickly, switch to PostgreSQL when deploying to production.
