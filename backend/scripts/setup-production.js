#!/usr/bin/env node

/**
 * Production Setup Script
 * 
 * This script helps generate secure secrets and validate production configuration
 * Run with: node scripts/setup-production.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔧 WhatsApp CRM Production Setup\n');

// Generate secure random secrets
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateVerifyToken() {
  return crypto.randomBytes(32).toString('base64url');
}

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envProdTemplatePath = path.join(__dirname, '..', '.env.production.template');

if (!fs.existsSync(envProdTemplatePath)) {
  console.error('❌ .env.production.template not found');
  process.exit(1);
}

// Generate secrets
const jwtSecret = generateSecret(64);
const waVerifyToken = generateVerifyToken();

console.log('✅ Generated secure secrets:');
console.log('');
console.log('JWT_SECRET (for API authentication):');
console.log(jwtSecret);
console.log('');
console.log('WA_VERIFY_TOKEN (for Meta webhook verification):');
console.log(waVerifyToken);
console.log('');

// Check existing .env
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists');
  console.log('');
  console.log('To update your .env file with the new secrets, add these lines:');
  console.log('');
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`WA_VERIFY_TOKEN=${waVerifyToken}`);
  console.log('');
  console.log('Or replace your .env file with .env.production.template and fill in the values.');
} else {
  console.log('📄 Creating .env file from template...');
  
  let template = fs.readFileSync(envProdTemplatePath, 'utf8');
  
  // Replace placeholder values with generated secrets
  template = template.replace('JWT_SECRET=""', `JWT_SECRET="${jwtSecret}"`);
  template = template.replace('WA_VERIFY_TOKEN=""', `WA_VERIFY_TOKEN="${waVerifyToken}"`);
  
  fs.writeFileSync(envPath, template);
  
  console.log('✅ Created .env file with secure defaults');
  console.log('');
  console.log('⚠️  IMPORTANT: Edit .env and fill in these required values:');
  console.log('   - DATABASE_URL (PostgreSQL connection string)');
  console.log('   - CORS_ORIGIN (your frontend domain)');
  console.log('');
  console.log('🚀 After configuring, start the server with: npm start');
}

console.log('');
console.log('📋 Production Checklist:');
console.log('  [ ] Set up PostgreSQL database');
console.log('  [ ] Configure DATABASE_URL in .env');
console.log('  [ ] Set CORS_ORIGIN to your frontend domain');
console.log('  [ ] Run database migrations: npm run db:deploy');
console.log('  [ ] Set up WhatsApp Business API credentials');
console.log('  [ ] Configure webhook URL in Meta Business settings');
console.log('  [ ] Set up SSL/TLS certificate');
console.log('  [ ] Configure firewall rules');
console.log('');
