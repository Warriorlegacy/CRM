#!/bin/bash

# Production Deployment Script for WhatsApp CRM
# Usage: ./deploy.sh [environment]
# Environments: production, staging

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying WhatsApp CRM to $ENVIRONMENT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ required, found $(node -v)"
        exit 1
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 not found, installing..."
        npm install -g pm2
    fi
    
    print_status "Prerequisites check passed ✅"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    cd backend
    
    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        print_error ".env.production file not found!"
        print_error "Please create it from .env.production.example"
        exit 1
    fi
    
    # Copy production env to .env
    cp .env.production .env
    
    print_status "Environment setup complete ✅"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    npm ci
    
    print_status "Dependencies installed ✅"
}

# Generate Prisma client
generate_prisma() {
    print_status "Generating Prisma client..."
    
    npx prisma generate
    
    print_status "Prisma client generated ✅"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    npx prisma migrate deploy
    
    print_status "Migrations complete ✅"
}

# Build application
build_app() {
    print_status "Building application..."
    
    npm run build
    
    print_status "Build complete ✅"
}

# Start/Restart application
start_app() {
    print_status "Starting application with PM2..."
    
    # Check if app is already running
    if pm2 list | grep -q "whatsapp-crm-api"; then
        print_status "Restarting existing application..."
        pm2 restart whatsapp-crm-api
    else
        print_status "Starting new application..."
        pm2 start dist/server.js --name "whatsapp-crm-api" --env production
    fi
    
    # Save PM2 config
    pm2 save
    
    print_status "Application started ✅"
}

# Setup PM2 startup script
setup_startup() {
    print_status "Setting up PM2 startup..."
    
    pm2 startup systemd -u $(whoami) --hp $(echo ~)
    
    print_status "PM2 startup configured ✅"
}

# Health check
health_check() {
    print_status "Running health check..."
    
    sleep 3
    
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Health check passed ✅"
    else
        print_error "Health check failed ❌"
        print_error "Check logs with: pm2 logs whatsapp-crm-api"
        exit 1
    fi
}

# Display status
display_status() {
    echo ""
    echo "=========================================="
    echo "  🎉 Deployment Complete!"
    echo "=========================================="
    echo ""
    echo "Application Status:"
    pm2 status whatsapp-crm-api
    echo ""
    echo "Logs: pm2 logs whatsapp-crm-api"
    echo "Stop: pm2 stop whatsapp-crm-api"
    echo "Restart: pm2 restart whatsapp-crm-api"
    echo ""
    echo "Health Check: http://localhost:3001/health"
    echo "=========================================="
}

# Main deployment flow
main() {
    print_status "Starting deployment process..."
    
    check_prerequisites
    setup_environment
    install_dependencies
    generate_prisma
    run_migrations
    build_app
    start_app
    setup_startup
    health_check
    display_status
    
    print_status "Deployment successful! 🚀"
}

# Run main function
main "$@"
