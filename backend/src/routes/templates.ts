import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const templatesRouter = Router();

// Middleware to extract auth headers
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

templatesRouter.use(extractAuth);

templatesRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const templates = await prisma.template.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ ok: true, templates });
});

templatesRouter.post('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { title, body } = req.body;

  const template = await prisma.template.create({
    data: {
      workspaceId,
      title,
      body,
    },
  });

  return res.json({ ok: true, template });
});

templatesRouter.patch('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const { title, body } = req.body;

  const template = await prisma.template.updateMany({
    where: { id, workspaceId },
    data: { title, body },
  });

  if (template.count === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  return res.json({ ok: true });
});

templatesRouter.delete('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const template = await prisma.template.deleteMany({
    where: { id, workspaceId },
  });

  if (template.count === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  return res.json({ ok: true });
});

export default templatesRouter;
