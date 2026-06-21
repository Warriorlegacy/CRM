import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthedRequest } from '../middleware/auth';

export const templatesRouter = Router();

const TemplateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
});

templatesRouter.get('/', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const templates = await prisma.template.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    success: true,
    data: { templates },
    templates,
  });
});

templatesRouter.post('/', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const parsed = TemplateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { title, body } = parsed.data;

  const template = await prisma.template.create({
    data: {
      workspaceId,
      title,
      body,
    },
  });

  return res.status(201).json({
    success: true,
    data: { template },
    template,
  });
});

templatesRouter.patch('/:id', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;
  const parsed = TemplateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { title, body } = parsed.data;

  const template = await prisma.template.updateMany({
    where: { id, workspaceId },
    data: { title, body },
  });

  if (template.count === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  return res.json({ success: true });
});

templatesRouter.delete('/:id', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const template = await prisma.template.deleteMany({
    where: { id, workspaceId },
  });

  if (template.count === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  return res.json({ success: true });
});

export default templatesRouter;
