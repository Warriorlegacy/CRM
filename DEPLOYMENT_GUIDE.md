# WhatsApp CRM - Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Git

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd whatsapp-crm
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup production environment
node scripts/setup-production.js

# Edit .env file with your actual values
nano .env
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:deploy

# Optional: Seed with initial data
npm run db:seed
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create production build
npm run build
```

### 5. Start Production Server

```bash
# Backend (from backend directory)
cd ../backend
npm start

# Frontend (from frontend directory) - serve with nginx or similar
cd ../frontend
# Upload build output to your static hosting/CDN
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Required
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<64-char-random-string>
CORS_ORIGIN=https://yourdomain.com

# WhatsApp Integration
WA_VERIFY_TOKEN=<your-verify-token>
META_API_VERSION=v20.0

# Optional
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=warn
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Backend
cd backend
docker build -t whatsapp-crm-backend .
docker run -p 3001:3001 --env-file .env whatsapp-crm-backend

# Frontend
cd ../frontend
docker build -t whatsapp-crm-frontend .
docker run -p 3000:3000 whatsapp-crm-frontend
```

---

## ☁️ Cloud Deployment

### Render.com

1. Create a new Web Service
2. Connect your GitHub repo
3. Set environment variables in Render Dashboard
4. Use the included `render.yaml` for blueprint deployment

### Railway

1. Connect your GitHub repo
2. Add PostgreSQL database from Railway marketplace
3. Set environment variables
4. Deploy

### AWS/Heroku/DigitalOcean

See `DEPLOYMENT.md` for detailed platform-specific instructions.

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is at least 64 characters (use setup script to generate)
- [ ] WA_VERIFY_TOKEN is random and secure
- [ ] DATABASE_URL uses strong password
- [ ] CORS_ORIGIN is set to your actual domain
- [ ] HTTPS is enabled
- [ ] Rate limiting is configured
- [ ] .env files are in .gitignore
- [ ] No hardcoded secrets in code
- [ ] Database is not publicly accessible

---

## 📊 Monitoring & Logs

### Health Check

```bash
curl https://api.yourdomain.com/health
```

### View Logs

```bash
# Docker
docker-compose logs -f backend

# PM2
pm2 logs whatsapp-crm

# Systemd
journalctl -u whatsapp-crm -f
```

---

## 🔄 Database Migrations

### Production Migration

```bash
cd backend
npm run db:deploy
```

### Backup Before Migration

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🆘 Troubleshooting

### "JWT_SECRET is too short"
Generate a new secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### "Database connection failed"
- Check DATABASE_URL format
- Ensure database is accessible from server
- Verify firewall rules

### "CORS errors"
- Verify CORS_ORIGIN matches your frontend URL exactly
- Include protocol (https://)

### "Port already in use"
- Change PORT in .env
- Or stop the process using the port: `lsof -ti:3001 | xargs kill -9`

---

## 📞 Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review environment variables
- Verify database connectivity
- Test API endpoints with curl/Postman

---

## 📝 Post-Deployment

1. **Register your first user** via `/register`
2. **Connect WhatsApp Business** in Settings → WhatsApp
3. **Configure webhook** in Meta Business settings
4. **Test incoming messages** by sending to your WhatsApp number
5. **Invite team members** via Workspace settings

---

**You're now ready to use WhatsApp CRM in production!** 🎉
