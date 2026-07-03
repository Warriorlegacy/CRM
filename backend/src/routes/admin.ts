import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const adminRouter = Router();

// Admin secret key - MUST be set via environment variable in production
const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET) {
  console.warn('⚠️  ADMIN_SECRET is not set. Admin routes will be disabled.');
}

function requireAdminSecret(req: Request, res: Response, next: NextFunction): void {
  if (!ADMIN_SECRET) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  if (secret !== ADMIN_SECRET) {
    res.status(403).json({ error: 'Forbidden', message: 'Invalid admin secret' });
    return;
  }
  next();
}

// Admin setup routes - only available when ADMIN_SECRET is configured
adminRouter.get('/setup', requireAdminSecret, async (_req, res) => {
  try {
    // Verify database connectivity by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Database is reachable. Schema migrations should be run via `npx prisma migrate deploy`.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'error', message });
  }
});

// Database health check (requires admin secret)
adminRouter.get('/db-health', requireAdminSecret, async (_req, res) => {
  try {
    const userCount = await prisma.user.count();
    const workspaceCount = await prisma.workspace.count();
    res.json({
      status: 'ok',
      database: 'connected',
      counts: { users: userCount, workspaces: workspaceCount },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'error', message });
  }
});
