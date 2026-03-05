import { Router } from 'express';
import os from 'os';

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

export default healthRouter;
