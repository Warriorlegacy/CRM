# Railway Deployment Configuration
# This file configures deployment to Railway.app

# ==========================================
# Option 1: Deploy Backend Only (Recommended)
# ==========================================
# The backend/railway.toml already contains the configuration
# Go to Railway dashboard → New Project → Connect GitHub repo
# Add the following environment variables:
#   - DATABASE_URL (PostgreSQL - Railway will provision this)
#   - JWT_SECRET (min 32 chars)
#   - WA_VERIFY_TOKEN
#   - META_API_VERSION (v20.0)

# ==========================================
# Option 2: Deploy with PostgreSQL
# ==========================================
# 1. In Railway dashboard, add a PostgreSQL plugin
# 2. Copy the connection string to DATABASE_URL
# 3. Deploy!

# ==========================================
# Required Environment Variables
# ==========================================
# DATABASE_URL=postgresql://user:pass@host:5432/dbname
# JWT_SECRET=your_secure_32_character_minimum_secret
# WA_VERIFY_TOKEN=your_webhook_verification_token
# META_API_VERSION=v20.0
# NODE_ENV=production
# PORT=3001

# ==========================================
# Quick Deploy Commands
# ==========================================
# npm install -g @railway/cli
# railway login
# railway init
# railway up
# railway domain set
