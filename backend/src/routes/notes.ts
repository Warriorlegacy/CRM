import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { publish } from '../realtime/events';

export const notesRouter = Router();

const prioritySchema = z.enum(['low', 'normal', 'high']);

const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  mentions: z.array(z.string()).default([]),
  conversationId: z.string().uuid(),
});

const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  mentions: z.array(z.string()).optional(),
});

notesRouter.get('/', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;
  const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;

  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId query parameter is required' });
  }

  try {
    const notes = await prisma.conversationNote.findMany({
      where: { workspaceId, conversationId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return res.json({ notes: notes.map((n) => ({
      id: n.id,
      conversationId: n.conversationId,
      userId: n.userId,
      userName: n.user?.name || null,
      content: n.content,
      priority: n.priority,
      mentions: JSON.parse(n.mentions || '[]'),
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }))});
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

notesRouter.post('/', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;
  const userId = (req as any).userId;

  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors.map((e) => e.message).join(', ') });
  }

  const { content, priority, mentions, conversationId } = parsed.data;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  try {
    const note = await prisma.conversationNote.create({
      data: {
        workspaceId,
        conversationId,
        userId,
        content,
        priority,
        mentions: JSON.stringify(mentions), // Serialize array to JSON string for SQLite compat
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Parse mentions back from JSON string
    const parsedMentions: string[] = JSON.parse(note.mentions || '[]');

    // Publish realtime event with mentions for in-app notifications
    publish(workspaceId, {
      type: 'new_conversation_note',
      conversationId: note.conversationId,
      note: {
        id: note.id,
        userId: note.userId,
        userName: note.user?.name || null,
        content: note.content,
        priority: note.priority,
        mentions: parsedMentions,
        createdAt: note.createdAt,
      },
      mentions: parsedMentions,
    });

    return res.status(201).json({
      id: note.id,
      conversationId: note.conversationId,
      userId: note.userId,
      userName: note.user?.name || null,
      content: note.content,
      priority: note.priority,
      mentions: parsedMentions,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

notesRouter.patch('/:id', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const parsed = updateNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors.map((e) => e.message).join(', ') });
  }

  const { content, priority, mentions } = parsed.data;

  try {
    const updated = await prisma.conversationNote.updateMany({
      where: { id, workspaceId },
      data: {
        ...(content !== undefined && { content }),
        ...(priority !== undefined && { priority }),
        ...(mentions !== undefined && { mentions: JSON.stringify(mentions) }), // Serialize to JSON string
      },
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = await prisma.conversationNote.findFirst({
      where: { id, workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return res.json({
      id: note!.id,
      conversationId: note!.conversationId,
      userId: note!.userId,
      userName: note!.user?.name || null,
      content: note!.content,
      priority: note!.priority,
      mentions: JSON.parse(note!.mentions || '[]'),
      createdAt: note!.createdAt,
      updatedAt: note!.updatedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

notesRouter.delete('/:id', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  try {
    const result = await prisma.conversationNote.deleteMany({
      where: { id, workspaceId },
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
