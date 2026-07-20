import 'dotenv/config';
import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

// Generate a secure random secret if not provided (only for development)
function generateSecureSecret(): string {
  return crypto.randomBytes(64).toString('hex');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  WA_VERIFY_TOKEN: process.env.WA_VERIFY_TOKEN!,
  IG_VERIFY_TOKEN: process.env.IG_VERIFY_TOKEN || '',
  META_API_VERSION: process.env.META_API_VERSION || 'v20.0',
  JWT_SECRET: process.env.JWT_SECRET || (isProduction ? '' : generateSecureSecret()),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  DEFAULT_WORKSPACE_ID: process.env.DEFAULT_WORKSPACE_ID || '',
  
  // Security settings
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Meta OAuth (WhatsApp & Instagram)
  META_APP_ID: process.env.META_APP_ID || '',
  META_APP_SECRET: process.env.META_APP_SECRET || '',
  META_CONFIG_ID: process.env.META_CONFIG_ID || '1333150785194697',
  BACKEND_URL: process.env.BACKEND_URL || 'https://whatsapp-crm-backend-one.vercel.app',
  FRONTEND_URL: process.env.FRONTEND_URL || (isProduction ? '' : 'http://localhost:3000'),
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || (isProduction ? '' : 'http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug'),
} as const;

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

if (isProduction) {
  requiredEnvVars.push('WA_VERIFY_TOKEN', 'CORS_ORIGIN');
}

const missingVars = requiredEnvVars.filter((key) => !env[key as keyof typeof env]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables (some features may not work):');
  missingVars.forEach((key) => console.warn(`   - ${key}`));
}

// Validate JWT_SECRET length
if (env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET is too short. Use a secure random string of at least 32 characters.');
}

if (isProduction) {
  console.log('✅ Environment validation passed (production mode)');
} else {
  console.log('⚠️  Running in development mode');
}
