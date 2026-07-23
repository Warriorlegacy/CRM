import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { Express, Request, Response } from 'express';
import { env } from '../env';
import { logger } from './logger';

export function setupSecurity(app: Express) {
  app.set('trust proxy', 1);

  const rawOrigin = env.CORS_ORIGIN || 'http://localhost:3000';
  const origin = rawOrigin === '*'
    ? '*'
    : rawOrigin.split(',').map(o => o.trim());

  logger.info('CORS Configured with origin:', { origin });

  const corsOptions: cors.CorsOptions = {
    origin: (requestOrigin, callback) => {
      // Allow server-to-server or no-origin requests
      if (!requestOrigin) return callback(null, true);

      // Automatically allow any vercel.app domain (production & previews) and localhost
      if (requestOrigin.endsWith('.vercel.app') || requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      if (origin === '*' || (Array.isArray(origin) && origin.includes(requestOrigin))) {
        return callback(null, true);
      }

      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-workspace-id', 'Accept'],
  };
  app.use(cors(corsOptions));

  // Rate Limiting — 1000 requests per 15 min per IP to prevent rate-limit errors
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 5,
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true,
  });
  app.use('/api/v1/auth', authLimiter);

  app.use((req: Request, res: Response, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
}
