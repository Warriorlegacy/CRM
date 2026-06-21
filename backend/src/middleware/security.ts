import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cors from 'cors';
import { Express, Request, Response } from 'express';
import { logger } from './logger';

export function setupSecurity(app: Express) {
  // Trust proxy (needed for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // CORS configuration
  const origin = process.env.CORS_ORIGIN === '*'
    ? '*'
    : process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3000'];

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

  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.CORS_ORIGIN || "http://localhost:3000"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
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

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'test' ? 1000 : 5, // 5 attempts in production, more in test
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true,
  });
  app.use('/api/v1/auth', authLimiter);

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Prevent parameter pollution
  app.use(hpp());

  // Security headers middleware
  app.use((req: Request, res: Response, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
  });
}
