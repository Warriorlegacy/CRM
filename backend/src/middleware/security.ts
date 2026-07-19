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
      logger.info('Incoming CORS request', { requestOrigin });
      if (!requestOrigin || origin === '*' || (Array.isArray(origin) && origin.includes(requestOrigin))) {
        callback(null, true);
      } else {
        logger.error('CORS rejected', { requestOrigin, expectedOrigins: origin });
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-workspace-id'],
  };
  app.use(cors(corsOptions));

  const cspConnectSrc = ["'self'"];
  if (rawOrigin !== '*') {
    rawOrigin.split(',').forEach(o => {
      const v = o.trim();
      if (v) cspConnectSrc.push(v);
    });
  }
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: cspConnectSrc,
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000),
      });
    },
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
