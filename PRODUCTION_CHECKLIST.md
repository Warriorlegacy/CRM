# 🚀 Production Deployment Checklist

This checklist ensures your WhatsApp CRM is ready for production.

## ✅ Pre-Deployment

### Security
- [ ] JWT_SECRET is at least 32 characters
- [ ] WA_VERIFY_TOKEN is secure and random
- [ ] All API keys/tokens are stored in environment variables
- [ ] No sensitive data in git repository
- [ ] .env files are in .gitignore
- [ ] Database password is strong
- [ ] SSL certificate installed
- [ ] Firewall configured (ports 80, 443, 22 only)

### Database
- [ ] PostgreSQL 14+ installed and running
- [ ] Database created and accessible
- [ ] Migrations run successfully
- [ ] Database backups configured
- [ ] Connection string tested

### WhatsApp Cloud API
- [ ] Meta Developer account created
- [ ] App created and WhatsApp product added
- [ ] Phone Number ID obtained
- [ ] Access Token generated (System User)
- [ ] Webhook URL configured (HTTPS)
- [ ] Webhook verified successfully
- [ ] Subscribe to "messages" webhook

### Domain & SSL
- [ ] Domain name registered
- [ ] DNS records configured (A record pointing to server)
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] www redirect configured (optional)

### Environment Variables
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-super-secret-32-char-min
WA_VERIFY_TOKEN=your-webhook-verify-token
META_API_VERSION=v20.0
CORS_ORIGIN=https://yourdomain.com
```

## ✅ Deployment Steps

1. **Prepare Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install dependencies
   sudo apt install -y nodejs postgresql nginx git
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/whatsapp-crm.git
   cd whatsapp-crm
   
   # Run deployment script
   chmod +x deploy.sh
   ./deploy.sh production
   ```

3. **Configure Nginx**
   ```bash
   sudo cp nginx/nginx.conf /etc/nginx/sites-available/whatsapp-crm
   sudo ln -s /etc/nginx/sites-available/whatsapp-crm /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Setup SSL**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

5. **Verify Deployment**
   - [ ] Application is running: `pm2 status`
   - [ ] Health check passes: `curl https://yourdomain.com/health`
   - [ ] Frontend loads: Open browser to `https://yourdomain.com`
   - [ ] API responds: `curl https://api.yourdomain.com/health`
   - [ ] Webhook receives messages: Send test WhatsApp message

## ✅ Post-Deployment

### Monitoring
- [ ] PM2 monitoring enabled: `pm2 monit`
- [ ] Log rotation configured: `pm2 install pm2-logrotate`
- [ ] Health check endpoint tested
- [ ] Error tracking (Sentry) configured (optional)
- [ ] Analytics (Google Analytics) configured (optional)

### Backup
- [ ] Database backup script created
- [ ] Backup automation (cron job) configured
- [ ] Backup restoration tested
- [ ] Offsite backup storage configured

### Maintenance
- [ ] Update script created
- [ ] Rollback procedure documented
- [ ] Team access configured
- [ ] Documentation updated

## 🔒 Security Hardening

### Server
- [ ] SSH key authentication only (disable password login)
- [ ] Fail2ban installed and configured
- [ ] Automatic security updates enabled
- [ ] UFW firewall enabled
- [ ] Unnecessary services disabled

### Application
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Input validation working
- [ ] SQL injection prevention (Prisma protects by default)

### Database
- [ ] Database user has minimal permissions
- [ ] Remote access disabled (unless needed)
- [ ] Connection SSL enforced
- [ ] Regular security patches

## 📊 Performance Optimization

- [ ] CDN configured for static assets (Cloudflare)
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Redis caching implemented (optional)
- [ ] Gzip compression enabled
- [ ] Images optimized

## 🆘 Rollback Plan

If deployment fails:

1. **Stop new version**: `pm2 stop whatsapp-crm-api`
2. **Revert code**: `git reset --hard HEAD~1`
3. **Rebuild**: `npm run build`
4. **Restart**: `pm2 start whatsapp-crm-api`
5. **Verify**: Check `/health` endpoint

## 📞 Support Contacts

- **Hosting Provider**: [Contact info]
- **Domain Registrar**: [Contact info]
- **SSL Provider**: [Contact info]
- **Team Lead**: [Contact info]

---

**After completing this checklist, your WhatsApp CRM will be production-ready! 🎉**
