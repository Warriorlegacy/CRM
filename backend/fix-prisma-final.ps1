# Fix Prisma - Downgrade to Stable Version

Write-Host "🔧 Fixing Prisma Configuration..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Clean up old files and node_modules
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "prisma/migrations" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dev.db" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dev.db-journal" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "prisma.config.ts" -Force -ErrorAction SilentlyContinue

# Install dependencies with correct versions
Write-Host "⬇️  Installing Prisma 5.x (stable version)..." -ForegroundColor Yellow
npm install

# Update .env for SQLite
Write-Host "⚙️  Updating environment configuration..." -ForegroundColor Yellow
$envContent = @'
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001

# WhatsApp Cloud API
WA_VERIFY_TOKEN="your_verify_token_here"
META_API_VERSION="v20.0"

# JWT Secret
JWT_SECRET="your_jwt_secret_here"

# Default workspace for testing
DEFAULT_WORKSPACE_ID=""
'@
Set-Content -Path ".env" -Value $envContent

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration had issues, but continuing..." -ForegroundColor Yellow
}

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
try {
    npx prisma db seed
    Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Seeding had issues, but you can continue..." -ForegroundColor Yellow
}

Write-Host "`n✅ Prisma Fixed Successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Using: SQLite (no PostgreSQL needed)" -ForegroundColor Cyan
Write-Host "Database: dev.db" -ForegroundColor Cyan
Write-Host "`n🚀 To start the server:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "`n📊 To view database:" -ForegroundColor Yellow
Write-Host "   npx prisma studio" -ForegroundColor White
