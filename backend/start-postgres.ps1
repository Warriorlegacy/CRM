# Quick PostgreSQL Starter

Write-Host "🔍 Checking PostgreSQL Status..." -ForegroundColor Cyan

# Check if PostgreSQL service exists
$service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "Found PostgreSQL service: $($service.Name)" -ForegroundColor Green
    
    if ($service.Status -eq 'Running') {
        Write-Host "✅ PostgreSQL is already running on port 5432" -ForegroundColor Green
    } else {
        Write-Host "🚀 Starting PostgreSQL service..." -ForegroundColor Yellow
        try {
            Start-Service $service.Name
            Write-Host "✅ PostgreSQL started successfully!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to start PostgreSQL: $_" -ForegroundColor Red
            exit 1
        }
    }
    
    # Create database if it doesn't exist
    Write-Host "🗄️  Checking database 'whatsapp_crm'..." -ForegroundColor Yellow
    $env:PGPASSWORD = "postgres"
    $result = psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='whatsapp_crm'" 2>$null
    
    if ($result -eq "1") {
        Write-Host "✅ Database 'whatsapp_crm' already exists" -ForegroundColor Green
    } else {
        Write-Host "🆕 Creating database 'whatsapp_crm'..." -ForegroundColor Yellow
        createdb -U postgres whatsapp_crm 2>$null
        if ($?) {
            Write-Host "✅ Database created!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Could not create database. You may need to run:" -ForegroundColor Yellow
            Write-Host "    createdb -U postgres whatsapp_crm" -ForegroundColor Cyan
        }
    }
    
    Write-Host "`n✨ PostgreSQL is ready!" -ForegroundColor Green
    Write-Host "You can now run: npx prisma migrate dev" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ PostgreSQL service not found!" -ForegroundColor Red
    Write-Host "`n📥 Install PostgreSQL:" -ForegroundColor Yellow
    Write-Host "   Option 1: choco install postgresql15" -ForegroundColor Cyan
    Write-Host "   Option 2: Download from https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "`n📝 Or use SQLite for testing (see POSTGRESQL_SETUP.md)" -ForegroundColor Gray
    exit 1
}
