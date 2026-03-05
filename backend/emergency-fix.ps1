# Emergency Fix - SQLite Compatible Schema

Write-Host "🚑 Emergency Fix for SQLite..." -ForegroundColor Red
Write-Host "==============================" -ForegroundColor Red

# Clean everything
Write-Host "🧹 Cleaning up old files..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "prisma/migrations" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dev.db" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dev.db-journal" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue

# Fresh install
Write-Host "⬇️  Installing dependencies..." -ForegroundColor Yellow
npm install

# Generate client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate client. Check schema file." -ForegroundColor Red
    exit 1
}

# Create database
Write-Host "🗄️  Creating database..." -ForegroundColor Yellow
npx prisma migrate dev --name init

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed." -ForegroundColor Red
    exit 1
}

# Seed
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npx prisma db seed

Write-Host "`n✅ SUCCESS! Database is ready!" -ForegroundColor Green
Write-Host "Run: npm run dev" -ForegroundColor Cyan
