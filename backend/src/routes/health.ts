import { Router } from 'express';
import os from 'os';
import { prisma } from '../prisma';
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

// Readiness check (for Kubernetes) - actually checks database
healthRouter.get('/ready', async (req, res) => {
  const checks: Record<string, string> = { api: 'operational' };
  let allOk = true;

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
    allOk = false;
  }

  res.status(allOk ? 200 : 503).json({
    ready: allOk,
    checks,
  });
});

// Liveness check (for Kubernetes)
healthRouter.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
  });
});

export default healthRouter;
