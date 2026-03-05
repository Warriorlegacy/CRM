# 🚀 Production Deployment Guide

Complete guide to deploy WhatsApp CRM to production.

## 📋 Prerequisites

- [ ] Node.js 18+ installed locally
- [ ] PostgreSQL database (cloud or self-hosted)
- [ ] WhatsApp Cloud API credentials from Meta
- [ ] Domain name (for SSL)
- [ ] Server/VPS or cloud platform account

## 🎯 Quick Deploy Options

### Option 1: Render (Easiest - Free tier available)

1. **Create account**: https://render.com
2. **Fork this repository** to your GitHub
3. **Create Blueprint**:
   - Go to Dashboard → Blueprints → New Blueprint
   - Connect your GitHub repo
   - Render will auto-detect `render.yaml`
4. **Set environment variables** in Render dashboard
5. **Deploy**: Automatic on git push

**Time**: 5 minutes

### Option 2: Railway (Easy - Free tier available)

1. **Create account**: https://railway.app
2. **New Project** → Deploy from GitHub repo
3. **Add PostgreSQL**: New → Database → Add PostgreSQL
4. **Set environment variables** in Variables tab
5. **Deploy**: Automatic

**Time**: 5 minutes

### Option 3: VPS/Dedicated Server

See [VPS Deployment](#vps-deployment) section below.

**Time**: 30 minutes

---

## 🔧 Pre-Deployment Checklist

### 1. Environment Variables

Create `.env.production` file in backend:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/whatsapp_crm?schema=public"
JWT_SECRET="your-super-secret-key-min-32-characters-long"
WA_VERIFY_TOKEN="your-webhook-verify-token"
META_API_VERSION="v20.0"
CORS_ORIGIN="https://yourdomain.com"
```

**Important**: Generate strong secrets:
```bash
# JWT Secret (32+ chars)
openssl rand -base64 32

# Webhook Verify Token
openssl rand -hex 16
```

### 2. Database Setup

#### Option A: Supabase (Free PostgreSQL)
1. Create account: https://supabase.com
2. New Project → Choose region closest to users
3. Settings → Database → Connection string
4. Copy `URI` connection string
5. Paste in `DATABASE_URL`

#### Option B: Neon (Serverless PostgreSQL)
1. Create account: https://neon.tech
2. New Project
3. Copy connection string
4. Use in environment variables

#### Option C: Self-hosted PostgreSQL
```bash
# Create database
sudo -u postgres createdb whatsapp_crm

# Create user
sudo -u postgres createuser -P whatsapp_user

# Set permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE whatsapp_crm TO whatsapp_user;"
```

### 3. WhatsApp Cloud API Setup

1. Go to https://developers.facebook.com/
2. Create App → Business type
3. Add Product → WhatsApp
4. Get credentials:
   - Phone Number ID
   - WhatsApp Business Account ID
   - Access Token (System User token for production)
5. Configure webhook:
   - Callback URL: `https://yourdomain.com/webhook`
   - Verify Token: Use your `WA_VERIFY_TOKEN`
   - Subscribe to: `messages`

### 4. SSL Certificate (for custom domain)

#### Using Let's Encrypt + Certbot

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

---

## 🐳 Docker Deployment

### Local Testing

```bash
# 1. Build and start
docker-compose up -d

# 2. Run migrations
docker-compose exec backend npx prisma migrate deploy

# 3. Seed database
docker-compose exec backend npx prisma db seed

# 4. Check logs
docker-compose logs -f
```

### Production with Docker

```bash
# Build production images
docker-compose -f docker-compose.prod.yml up -d

# Or build manually
cd backend
docker build -t whatsapp-crm-backend:latest .
docker run -d \
  -p 3001:3001 \
  --env-file .env.production \
  whatsapp-crm-backend:latest
```

---

## 🖥️ VPS Deployment

### Server Requirements
- Ubuntu 20.04+ or Debian 11+
- 2GB RAM minimum (4GB recommended)
- 20GB storage
- PostgreSQL 14+
- Node.js 18+
- Nginx (reverse proxy)
- PM2 (process manager)

### Step-by-Step Setup

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

#### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE whatsapp_crm;

# Create user
CREATE USER whatsapp_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE whatsapp_crm TO whatsapp_user;

# Exit
\q
```

#### 3. Application Setup

```bash
# Create app directory
mkdir -p /var/www/whatsapp-crm
cd /var/www/whatsapp-crm

# Clone repository
git clone https://github.com/yourusername/whatsapp-crm.git .

# Backend setup
cd backend
npm install
npx prisma generate

# Create .env file
nano .env
# (Paste environment variables)

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2
pm2 start dist/server.js --name "whatsapp-crm-api"
pm2 save
pm2 startup

# Frontend setup
cd ../frontend
npm install
npm run build
```

#### 4. Nginx Configuration

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/whatsapp-crm
```

Paste configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/whatsapp-crm/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## 📊 Monitoring & Maintenance

### Logs

```bash
# Backend logs
pm2 logs whatsapp-crm-api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Database Backup

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U whatsapp_user whatsapp_crm > /backups/whatsapp_crm_$DATE.sql

# Keep only last 7 days
find /backups -name "whatsapp_crm_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

### Updates

```bash
# Pull latest code
git pull origin main

# Backend
cd backend
npm install
npx prisma migrate deploy
npm run build
pm2 restart whatsapp-crm-api

# Frontend
cd ../frontend
npm install
npm run build
```

---

## 🔒 Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Firewall enabled (ufw/iptables)
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Security headers enabled
- [ ] Regular dependency updates
- [ ] Database backups automated

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Application Won't Start
```bash
# Check logs
pm2 logs

# Check environment variables
cat backend/.env

# Verify database migrations
npx prisma migrate status
```

### Webhook Not Receiving Messages
1. Verify callback URL is accessible
2. Check SSL certificate is valid
3. Verify WA_VERIFY_TOKEN matches
4. Check firewall isn't blocking requests

---

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs` or `docker-compose logs`
2. Verify environment variables
3. Test database connection
4. Check firewall settings

---

**Your WhatsApp CRM is now production-ready! 🎉**
