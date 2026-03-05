# PostgreSQL Setup Guide for Windows

## Option 1: Install PostgreSQL with Chocolatey (Recommended)

```powershell
# Install Chocolatey if not installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install PostgreSQL 15
choco install postgresql15

# Create database
createdb -U postgres whatsapp_crm

# Start PostgreSQL service
net start postgresql-x64-15
```

## Option 2: Download & Install PostgreSQL

1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Set password to: `postgres`
4. Make sure "Start service" is checked

## Option 3: Use SQLite Instead (Quick Testing)

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

And `prisma.config.ts`:
```typescript
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
```

## Option 4: Use Prisma Cloud (Free PostgreSQL)

```bash
npx prisma cloud
```

Or create a free database at:
- https://neon.tech/
- https://supabase.com/
- https://railway.app/

Update `.env` with your cloud database URL.

## Quick Check

After starting PostgreSQL, verify with:

```powershell
# Check if PostgreSQL is running
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Or test connection
psql -U postgres -h localhost -c "SELECT 1;"
```

## 🔥 Quick Fix Script

Save as `start-postgres.ps1`:

```powershell
# Check if PostgreSQL service exists
$service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($service) {
    if ($service.Status -eq 'Running') {
        Write-Host "✅ PostgreSQL is already running" -ForegroundColor Green
    } else {
        Write-Host "🚀 Starting PostgreSQL..." -ForegroundColor Yellow
        Start-Service $service.Name
        Write-Host "✅ PostgreSQL started" -ForegroundColor Green
    }
} else {
    Write-Host "❌ PostgreSQL not found. Install it first:" -ForegroundColor Red
    Write-Host "choco install postgresql15" -ForegroundColor Cyan
}
```

Run it:
```powershell
.\start-postgres.ps1
```

Then retry:
```bash
npx prisma migrate dev --name add_typing_and_read_receipts
```
