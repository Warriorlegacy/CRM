import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

export const autoresponderRouter = Router();

const AutoresponderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  trigger: z.enum(['keyword', 'new_contact', 'no_reply', 'away_message']),
  keyword: z.string().optional(),
  delayMinutes: z.number().min(0).max(1440).default(0),
  message: z.string().min(1, 'Message is required'),
  isActive: z.boolean().default(true),
  stages: z.array(z.string()).optional(),
});

autoresponderRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  try {
    const responders = await prisma.autoresponder.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    // Adapt database representation to expected JSON format for stages and boolean
    const adaptedResponders = responders.map((r) => ({
      ...r,
      stages: typeof r.stages === 'string' ? JSON.parse(r.stages) : r.stages,
      isActive: Boolean(r.isActive),
    }));

    return res.json({ ok: true, responders: adaptedResponders });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

autoresponderRouter.post('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const parsed = AutoresponderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: parsed.error.flatten() 
    });
  }

  const { name, trigger, keyword, delayMinutes, message, isActive, stages } = parsed.data;

  try {
    const responder = await prisma.autoresponder.create({
      data: {
        workspaceId,
        name,
        trigger,
        keyword: keyword || null,
        delayMinutes,
        message,
        isActive,
        stages: stages ? JSON.stringify(stages) : null,
      },
    });

    return res.json({ ok: true, message: 'Autoresponder created', responder });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

autoresponderRouter.patch('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const { name, trigger, keyword, delayMinutes, message, isActive, stages } = req.body;

  try {
    const responder = await prisma.autoresponder.updateMany({
      where: { id, workspaceId },
      data: {
        ...(name !== undefined && { name }),
        ...(trigger !== undefined && { trigger }),
        ...(keyword !== undefined && { keyword: keyword || null }),
        ...(delayMinutes !== undefined && { delayMinutes }),
        ...(message !== undefined && { message }),
        ...(isActive !== undefined && { isActive }),
        ...(stages !== undefined && { stages: stages ? JSON.stringify(stages) : null }),
      },
    });

    if (responder.count === 0) {
      return res.status(404).json({ error: 'Autoresponder not found' });
    }

    return res.json({ ok: true, message: 'Autoresponder updated' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

autoresponderRouter.delete('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  try {
    const result = await prisma.autoresponder.deleteMany({
      where: { id, workspaceId },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Autoresponder not found' });
    }

    return res.json({ ok: true, message: 'Autoresponder deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default autoresponderRouter;
