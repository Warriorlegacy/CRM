import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const webhooksLogRouter = Router();

const extractAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.header('x-user-id');
  const workspaceId = req.header('x-workspace-id');

  if (!userId || !workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-user-id or x-workspace-id headers',
    });
  }

  (req as any).userId = userId;
  (req as any).workspaceId = workspaceId;
  next();
};

webhooksLogRouter.use(extractAuth);

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
