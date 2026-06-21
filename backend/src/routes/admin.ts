import { Router } from 'express';
import { execSync } from 'child_process';
import { prisma } from '../prisma';

export const adminRouter = Router();

// One-time setup: push schema + seed
adminRouter.get('/setup', async (_req, res) => {
  try {
    // Step 1: Push schema to database
    execSync('npx prisma db push --skip-generate', {
      cwd: process.cwd(),
      stdio: 'pipe',
      timeout: 60000,
    });

    // Step 2: Run seed
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

// Just push schema (no seed)
adminRouter.get('/db-push', async (_req, res) => {
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

// Just seed (requires tables to exist)
adminRouter.get('/seed', async (_req, res) => {
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
