import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

export const notesRouter = Router();

notesRouter.get('/:contactId', async (req, res) => {
  const { contactId } = req.params;

  try {
    const notes = await prisma.contactNote.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ ok: true, notes });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
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

  try {
    const note = await prisma.contactNote.create({
      data: {
        workspaceId,
        contactId,
        userId,
        content,
        type,
      },
    });
    return res.json({ ok: true, message: 'Note added successfully', note });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

notesRouter.delete('/:noteId', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { noteId } = req.params;

  try {
    const result = await prisma.contactNote.deleteMany({
      where: { id: noteId, workspaceId },
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.json({ ok: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default notesRouter;
