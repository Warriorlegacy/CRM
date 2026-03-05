import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const contactsRouter = Router();

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

contactsRouter.use(extractAuth);

contactsRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { search, stage, tag } = req.query;

  const where: any = { workspaceId };

  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { phone: { contains: search as string } },
    ];
  }

  if (stage) {
    where.stage = stage;
  }

  if (tag) {
    where.tags = { contains: tag as string };
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return res.json({ ok: true, contacts });
});

contactsRouter.post('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { name, phone, email, tags, stage } = req.body;

  try {
    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        name,
        phone,
        email,
        tags: tags || '',
        stage: stage || 'new',
      },
    });
    return res.json({ ok: true, contact });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Contact with this phone already exists' });
    }
    throw error;
  }
});

contactsRouter.patch('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const { name, email, tags, stage, assignedToId } = req.body;

  const contact = await prisma.contact.updateMany({
    where: { id, workspaceId },
    data: { name, email, tags, stage, assignedToId },
  });

  if (contact.count === 0) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  return res.json({ ok: true });
});

export default contactsRouter;
