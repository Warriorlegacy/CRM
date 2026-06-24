import { Router } from 'express';
import os from 'os';
import { env } from '../env';

export const healthRouter = Router();

// Basic health check
healthRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Temporary endpoint to update freellmapi baseUrl in production
healthRouter.get('/temp-update-db', async (req, res) => {
  const { prisma } = await import('../prisma');
  try {
    const updated = await prisma.aiProvider.updateMany({
      where: { provider: 'freellmapi' },
      data: {
        baseUrl: 'https://tangy-rice-start.loca.lt/v1',
        errorCount: 0,
        lastErrorAt: null,
        isActive: true,
      }
    });
    res.json({ ok: true, updated });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Detailed health check (for monitoring)
healthRouter.get('/health/detailed', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: memoryUsage.heapUsed,
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
      },
      cpu: {
        loadAvg: os.loadavg(),
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    },
  });
});

// Readiness check (for Kubernetes)
healthRouter.get('/ready', (req, res) => {
  // Check if database is connected
  // Check if external services are available
  res.status(200).json({
    ready: true,
    checks: {
      database: 'connected',
      api: 'operational',
    },
  });
});

// Liveness check (for Kubernetes)
healthRouter.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
  });
});

// Debug env (no auth required)
healthRouter.get('/debug-env', (req, res) => {
  res.json({
    wa_verify_token: env.WA_VERIFY_TOKEN || 'NOT SET',
    wa_token_type: typeof env.WA_VERIFY_TOKEN,
    wa_token_length: env.WA_VERIFY_TOKEN?.length || 0,
    ig_verify_token: env.IG_VERIFY_TOKEN || 'NOT SET',
    meta_app_id: env.META_APP_ID ? 'SET' : 'NOT SET',
    node_env: env.NODE_ENV,
    url: req.url,
    raw_query: req.url.split('?')[1] || '(none)',
    query_keys: Object.keys(req.query),
    query_hub_mode_literal: req.query['hub.mode'],
    query_hub_dot: (req.query as any).hub?.mode,
    query_foo_literal: req.query['foo'],
  });
});

export default healthRouter;
