import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

export const webhooksLogRouter = Router();

webhooksLogRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { type, limit = '50' } = req.query;

  try {
    const logs = await prisma.webhookLog.findMany({
      where: {
        workspaceId,
        ...(type ? { type: String(type) } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
    });

    const count = await prisma.webhookLog.count({
      where: { workspaceId },
    });

    return res.json({ 
      ok: true, 
      logs,
      count,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

webhooksLogRouter.get('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  try {
    const log = await prisma.webhookLog.findFirst({
      where: { id, workspaceId },
    });

    if (!log) {
      return res.status(404).json({ error: 'Webhook log not found' });
    }

    return res.json({ ok: true, log });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

webhooksLogRouter.delete('/clear', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  try {
    await prisma.webhookLog.deleteMany({
      where: { workspaceId },
    });
    return res.json({ ok: true, message: 'Webhook logs cleared' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default webhooksLogRouter;
