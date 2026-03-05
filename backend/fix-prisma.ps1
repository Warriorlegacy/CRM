# Fix Prisma Configuration

Write-Host "🔧 Fixing Prisma 7.3.0 Configuration..." -ForegroundColor Cyan

# Check if node_modules exists
if (!(Test-Path node_modules)) {
    Write-Host "⬇️  Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Generate Prisma client
Write-Host "🔄 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name add_typing_and_read_receipts

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npx prisma db seed

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "You can now run: npm run dev" -ForegroundColor Cyan
