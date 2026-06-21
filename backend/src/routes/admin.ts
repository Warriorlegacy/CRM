import { Router, Request, Response, NextFunction } from 'express';
import { execSync } from 'child_process';

export const adminRouter = Router();

// Admin secret key - only accessible with this key
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-this-in-production';

function requireAdminSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  if (secret !== ADMIN_SECRET) {
    res.status(403).json({ error: 'Forbidden', message: 'Invalid admin secret' });
    return;
  }
  next();
}

// Admin setup routes - only available in development or when explicitly enabled
const ADMIN_ENABLED = process.env.NODE_ENV !== 'production' || process.env.ADMIN_ENABLED === 'true';

if (!ADMIN_ENABLED) {
  adminRouter.all('*', (_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
} else {
  // One-time setup: push schema + seed (requires admin secret)
  adminRouter.get('/setup', requireAdminSecret, async (_req, res) => {
    try {
      execSync('npx prisma db push --skip-generate', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60000,
      });

      execSync('npx ts-node prisma/seed.ts', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60000,
      });

      res.json({ status: 'ok', message: 'Database pushed and seeded successfully' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: 'error', message });
    }
  });

  // Just push schema (requires admin secret)
  adminRouter.get('/db-push', requireAdminSecret, async (_req, res) => {
    try {
      execSync('npx prisma db push --skip-generate', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60000,
      });
      res.json({ status: 'ok', message: 'Schema pushed successfully' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: 'error', message });
    }
  });

  // Just seed (requires admin secret)
  adminRouter.get('/seed', requireAdminSecret, async (_req, res) => {
    try {
      execSync('npx ts-node prisma/seed.ts', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60000,
      });
      res.json({ status: 'ok', message: 'Database seeded successfully' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: 'error', message });
    }
  });
}
