# Switch to SQLite (No PostgreSQL Required)

Write-Host "🔄 Switching to SQLite (No PostgreSQL needed!)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Backup PostgreSQL schema if not already backed up
if (!(Test-Path "prisma/schema.postgres.prisma")) {
    Write-Host "📦 Backing up PostgreSQL schema..." -ForegroundColor Yellow
    Copy-Item "prisma/schema.prisma" "prisma/schema.postgres.prisma"
}

# Copy SQLite schema
Write-Host "📄 Switching to SQLite schema..." -ForegroundColor Yellow
Copy-Item "prisma/schema.sqlite.prisma" "prisma/schema.prisma" -Force

# Update prisma.config.ts for SQLite
Write-Host "⚙️  Updating Prisma config..." -ForegroundColor Yellow
$configContent = @'
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
'@
Set-Content -Path "prisma.config.ts" -Value $configContent

# Check if dependencies are installed
Write-Host "⬇️  Installing dependencies..." -ForegroundColor Yellow
npm install

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Run migrations
Write-Host "🗄️  Creating database..." -ForegroundColor Yellow
npx prisma migrate dev --name init_sqlite

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed. Trying reset..." -ForegroundColor Yellow
    Remove-Item -Path "prisma/migrations" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "dev.db" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "dev.db-journal" -Force -ErrorAction SilentlyContinue
    npx prisma migrate dev --name init_sqlite
}

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npx prisma db seed

Write-Host "`n✅ SUCCESS! SQLite is ready!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Your database is stored in: dev.db" -ForegroundColor Cyan
Write-Host "No PostgreSQL needed!" -ForegroundColor Cyan
Write-Host "`n🚀 To start the server, run:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
