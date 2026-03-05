# WhatsApp CRM - Setup Script

Write-Host "🚀 WhatsApp CRM Setup" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

# Backend setup
Write-Host "`n📦 Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file" -ForegroundColor Green
}

Write-Host "⬇️  Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🏗️  Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npx prisma db seed

Set-Location ..

# Frontend setup
Write-Host "`n📦 Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend

if (!(Test-Path .env.local)) {
    Copy-Item .env.example .env.local
    Write-Host "✅ Created .env.local file" -ForegroundColor Green
}

Write-Host "⬇️  Installing dependencies..." -ForegroundColor Yellow
npm install

Set-Location ..

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nTo start the application:" -ForegroundColor Cyan
Write-Host "  1. Backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "`nBackend will run on http://localhost:3001" -ForegroundColor Gray
Write-Host "Frontend will run on http://localhost:3000" -ForegroundColor Gray
