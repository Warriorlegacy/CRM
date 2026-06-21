import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

export const notesRouter = Router();

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

notesRouter.use(extractAuth);

notesRouter.get('/:contactId', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { contactId } = req.params;

  const notes = await prisma.$queryRaw`
    SELECT * FROM ContactNote 
    WHERE contactId = ${contactId}
    ORDER BY createdAt DESC
  `;

  return res.json({ ok: true, notes });
});

notesRouter.post('/:contactId', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const userId = (req as any).userId;
  const { contactId } = req.params;
  const { content, type = 'note' } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
  });

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  await prisma.$executeRaw`
    INSERT INTO ContactNote (id, workspaceId, contactId, userId, content, type, "createdAt", "updatedAt")
    VALUES (
      ${require('crypto').randomUUID()},
      ${workspaceId},
      ${contactId},
      ${userId},
      ${content},
      ${type},
      ${new Date()},
      ${new Date()}
    )
  `;

  return res.json({ ok: true, message: 'Note added successfully' });
});

notesRouter.delete('/:noteId', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { noteId } = req.params;

  await prisma.$executeRaw`
    DELETE FROM ContactNote 
    WHERE id = ${noteId} AND workspaceId = ${workspaceId}
  `;

  return res.json({ ok: true, message: 'Note deleted successfully' });
});

export default notesRouter;
