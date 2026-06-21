import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

export const webhooksLogRouter = Router();

webhooksLogRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { type, limit = '50' } = req.query;

  const logs = await prisma.$queryRaw<any[]>`
    SELECT * FROM WebhookLog 
    WHERE workspaceId = ${workspaceId}
    ${type ? require('prisma').$queryRaw`AND type = ${type}` : require('prisma').$queryRaw``}
    ORDER BY createdAt DESC
    LIMIT ${parseInt(limit as string)}
  `;

  const countResult = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*) as count FROM WebhookLog 
    WHERE workspaceId = ${workspaceId}
  `;

  return res.json({ 
    ok: true, 
    logs,
    count: countResult[0]?.count || 0,
  });
});

webhooksLogRouter.get('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const logResult = await prisma.$queryRaw<any[]>`
    SELECT * FROM WebhookLog 
    WHERE id = ${id} AND workspaceId = ${workspaceId}
  `;

  return res.json({ ok: true, log: logResult[0] });
});

webhooksLogRouter.delete('/clear', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  await prisma.$executeRaw`
    DELETE FROM WebhookLog 
    WHERE workspaceId = ${workspaceId}
  `;

  return res.json({ ok: true, message: 'Webhook logs cleared' });
});

export default webhooksLogRouter;
