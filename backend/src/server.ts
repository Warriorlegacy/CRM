import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import { setupSecurity } from './middleware/security';
import { logger, requestLogger, errorLogger } from './middleware/logger';
import { prisma } from './prisma';
import { env } from './env';
import { requireAuth } from './middleware/auth';
import { initWebSocketServer } from './realtime/websocket';
import { startTokenRefreshCron } from './cron/tokenRefresh';
import { startAutoresponseCron } from './cron/autoresponse';
import { startEmailCampaignCron } from './cron/emailCampaign';

// Routes
import { webhooksRouter } from './routes/webhooks';
import { realtimeRouter } from './routes/realtime';
import healthRouter from './routes/health';
import inboxRouter from './routes/inbox';
import messagesRouter from './routes/messages';
import contactsRouter from './routes/contacts';
import followupsRouter from './routes/followups';
import templatesRouter from './routes/templates';
import workspaceRouter from './routes/workspace';
import typingRouter from './routes/typing';
import readReceiptRouter from './routes/readReceipts';
import authRouter from './routes/auth';
import { adminRouter } from './routes/admin';
import { analyticsRouter } from './routes/analytics';
import { exportRouter } from './routes/export';
import broadcastRouter from './routes/broadcast';
import { broadcastsRouter } from './routes/broadcasts';
import mediaRouter from './routes/media';
import inviteRouter from './routes/invite';
import activityRouter from './routes/activity';
import searchRouter from './routes/search';
import autoresponderRouter from './routes/autoresponder';
import webhooksLogRouter from './routes/webhooksLog';
import chatbotFlowsRouter from './routes/chatbotFlows';
import { aiRouter } from './routes/ai';
import verifyRouter from './routes/verify';
import { dealsRouter } from './routes/deals';
import automationRouter from './routes/automation';
import { oauthRouter } from './routes/oauth';
import notesRouter from './routes/notes';
import conversationLocksRouter from './routes/conversationLocks';
import { emailCampaignsRouter } from './routes/emailCampaigns';
import { emailAutomationRouter } from './routes/emailAutomation';
import importRouter from './routes/import';
import notificationsRouter from './routes/notifications';

const app = express();

// Parse cookies (used for OAuth context cookie)
app.use(cookieParser());

// Setup security middleware
setupSecurity(app);

// Logging
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'WhatsApp CRM Backend',
    status: 'ok',
    health: '/health',
    auth: '/api/v1/auth',
  });
});

// Health checks (no auth required)
app.use('/', healthRouter);

// WhatsApp & Instagram Webhooks (no auth required for Meta callbacks)
app.use('/', webhooksRouter);
app.use('/webhooks', webhooksRouter);
app.use('/api/v1/webhooks', webhooksRouter);

// Auth routes (no auth required for login/register)
app.use('/api/v1/auth', authRouter);

// OAuth routes (no auth required for redirects/callbacks, state token handles workspaceId)
app.use('/api/v1/oauth', oauthRouter);

// Admin setup routes (no auth required for initial setup)
app.use('/api/v1/admin', adminRouter);

// Email verification (no auth required for token verification)
app.use('/api/v1/verify', verifyRouter);

// Protected API Routes - require JWT authentication
app.use('/api/v1/inbox', requireAuth, inboxRouter);
app.use('/api/v1/messages', requireAuth, messagesRouter);
app.use('/api/v1/contacts', requireAuth, contactsRouter);
app.use('/api/v1/notes', requireAuth, notesRouter);
app.use('/api/v1/followups', requireAuth, followupsRouter);
app.use('/api/v1/templates', requireAuth, templatesRouter);
app.use('/api/v1/workspaces', requireAuth, workspaceRouter);
app.use('/api/v1/typing', requireAuth, typingRouter);
app.use('/api/v1/read-receipts', requireAuth, readReceiptRouter);
app.use('/api/v1/analytics', requireAuth, analyticsRouter);
app.use('/api/v1/export', requireAuth, exportRouter);
app.use('/api/v1/broadcast', requireAuth, broadcastRouter);
app.use('/api/v1/broadcasts', requireAuth, broadcastsRouter);
app.use('/api/v1/media', requireAuth, mediaRouter);
app.use('/api/v1/invite', requireAuth, inviteRouter);
app.use('/api/v1/activity', requireAuth, activityRouter);
app.use('/api/v1/search', requireAuth, searchRouter);
app.use('/api/v1/deals', requireAuth, dealsRouter);
app.use('/api/v1/autoresponders', requireAuth, autoresponderRouter);
app.use('/api/v1/webhooks-log', requireAuth, webhooksLogRouter);
app.use('/api/v1/chatbot-flows', requireAuth, chatbotFlowsRouter);
app.use('/api/v1/ai', requireAuth, aiRouter);
app.use('/api/v1/automation', requireAuth, automationRouter);

// Email Campaigns & Automation - protected
app.use('/api/v1/email-campaigns', requireAuth, emailCampaignsRouter);
app.use('/api/v1/email-automation', requireAuth, emailAutomationRouter);

// Import/Export
app.use('/api/v1/import', requireAuth, importRouter);

// Notifications
app.use('/api/v1/notifications', requireAuth, notificationsRouter);

// Real-time SSE - protected
app.use('/realtime', requireAuth, realtimeRouter);

// Error handling
app.use(errorLogger);
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const isProduction = env.NODE_ENV === 'production';

  // Log error details
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).userId,
    timestamp: new Date().toISOString(),
  });

  // Don't expose internal errors in production
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProduction ? 'Something went wrong' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing HTTP server gracefully');
  await prisma.$disconnect();
  logger.info('Database connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing HTTP server gracefully');
  await prisma.$disconnect();
  logger.info('Database connection closed');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const errorMsg = reason instanceof Error ? `${reason.message}\n${reason.stack}` : JSON.stringify(reason);
  logger.error(`Unhandled Rejection: ${errorMsg}`);
});

const server = http.createServer(app);
try {
  initWebSocketServer(server);
} catch (e) {
  logger.warn('WebSocket init skipped (serverless env)', e);
}

const isVercelRuntime = Boolean(process.env.VERCEL);

if (process.env.NODE_ENV !== 'test' && !isVercelRuntime) {
  server.listen(env.PORT, () => {
    logger.info(`✅ Server running on port ${env.PORT}`);
    logger.info(`📱 Environment: ${env.NODE_ENV}`);
    logger.info(`🔒 JWT/WebSocket Authentication: enabled`);
    logger.info(`📡 Health check: http://localhost:${env.PORT}/health`);
    logger.info(`🔐 API Documentation:`);
    logger.info(`   POST /api/v1/auth/register - Register new user`);
    logger.info(`   POST /api/v1/auth/login - Login`);
    logger.info(`   POST /api/v1/auth/refresh - Refresh token`);
    logger.info(`   GET /api/v1/auth/me - Get current user`);

    // Start background cron jobs
    startTokenRefreshCron();
    logger.info(`🔄 Token Refresh Cron: scheduled`);
    startAutoresponseCron();
    logger.info(`⏰ Autoresponse Cron: scheduled`);
    startEmailCampaignCron();
    logger.info(`📧 Email Campaign Cron: scheduled`);
  });
}

export default app;
module.exports = app;
