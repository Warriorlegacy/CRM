import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendWhatsAppText } from '../whatsapp/meta';

export const autoresponderRouter = Router();

const AutoresponderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  trigger: z.enum(['keyword', 'new_contact', 'no_reply']),
  keyword: z.string().optional(),
  delayMinutes: z.number().min(0).max(1440).default(0),
  message: z.string().min(1, 'Message is required'),
  isActive: z.boolean().default(true),
  stages: z.array(z.string()).optional(),
});

autoresponderRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const responders = await prisma.$queryRaw`
    SELECT * FROM Autoresponder 
    WHERE workspaceId = ${workspaceId}
    ORDER BY createdAt DESC
  `;

  return res.json({ ok: true, responders });
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

  await prisma.$executeRaw`
    INSERT INTO Autoresponder (id, workspaceId, name, trigger, keyword, "delayMinutes", message, "isActive", stages, "createdAt", "updatedAt")
    VALUES (
      ${require('crypto').randomUUID()},
      ${workspaceId},
      ${name},
      ${trigger},
      ${keyword || null},
      ${delayMinutes},
      ${message},
      ${isActive ? 1 : 0},
      ${stages ? JSON.stringify(stages) : null},
      ${new Date()},
      ${new Date()}
    )
  `;

  return res.json({ ok: true, message: 'Autoresponder created' });
});

autoresponderRouter.patch('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const { name, trigger, keyword, delayMinutes, message, isActive, stages } = req.body;

  const updates: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (trigger !== undefined) {
    updates.push('trigger = ?');
    values.push(trigger);
  }
  if (keyword !== undefined) {
    updates.push('keyword = ?');
    values.push(keyword);
  }
  if (delayMinutes !== undefined) {
    updates.push('"delayMinutes" = ?');
    values.push(delayMinutes);
  }
  if (message !== undefined) {
    updates.push('message = ?');
    values.push(message);
  }
  if (isActive !== undefined) {
    updates.push('"isActive" = ?');
    values.push(isActive ? 1 : 0);
  }
  if (stages !== undefined) {
    updates.push('stages = ?');
    values.push(JSON.stringify(stages));
  }

  updates.push('"updatedAt" = ?');
  values.push(new Date());
  values.push(id, workspaceId);

  await prisma.$executeRaw`
    UPDATE Autoresponder 
    SET ${require('util').format(updates.join(', '))}
    WHERE id = ? AND workspaceId = ?
  `;

  return res.json({ ok: true, message: 'Autoresponder updated' });
});

autoresponderRouter.delete('/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  await prisma.$executeRaw`
    DELETE FROM Autoresponder 
    WHERE id = ${id} AND workspaceId = ${workspaceId}
  `;

  return res.json({ ok: true, message: 'Autoresponder deleted' });
});

export default autoresponderRouter;
