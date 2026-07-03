import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthedRequest } from '../middleware/auth';
import { getWorkspaceLimits, checkLimit } from '../middleware/limits';

export const contactsRouter = Router();

// Cast prisma to `any` so that post-schema-migration models are callable
// before `prisma generate` is re-run with the updated schema.
const xprisma = prisma as any;

// ─── Conversation Tags ──────────────────────────────────────────────

const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name must be ≤ 50 chars'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex code like #6366f1').optional(),
  description: z.string().max(200).optional().or(z.literal('')),
});

contactsRouter.get('/conversations/tags', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const tags = await (prisma as any).conversationTag.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
  });

  return res.json({ tags });
});

contactsRouter.post('/conversations/tags', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const parsed = CreateTagSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { name, color, description } = parsed.data;
  const safeColor = color || '#6366f1';

  const tag = await (prisma as any).conversationTag.create({
    data: {
      workspaceId,
      name: name.trim(),
      color: safeColor,
      description: description?.trim() || null,
    },
  });

  return res.status(201).json({ tag });
});

contactsRouter.delete('/conversations/tags/:tagId', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { tagId } = req.params;

  const tag = await (prisma as any).conversationTag.findFirst({
    where: { id: tagId, workspaceId },
  });

  if (!tag) {
    return res.status(404).json({ error: 'Tag not found' });
  }

  await (prisma as any).conversationTagAssignment.deleteMany({
    where: { tagId },
  });

  await (prisma as any).conversationTag.delete({
    where: { id: tagId },
  });

  return res.status(204).send();
});

contactsRouter.post('/conversations/:id/tags', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const conversationId = req.params.id;
  const { tagId } = req.body;

  if (!tagId) {
    return res.status(400).json({ error: 'tagId is required' });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const tag = await xprisma.conversationTag.findFirst({
    where: { id: tagId, workspaceId },
  });

  if (!tag) {
    return res.status(404).json({ error: 'Tag not found in this workspace' });
  }

  const assignment = await xprisma.conversationTagAssignment.create({
    data: {
      conversationId,
      tagId,
      workspaceId,
    },
    include: { tag: true },
  });

  return res.status(201).json({ assignment });
});

contactsRouter.delete('/conversations/:id/tags/:tagId', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const conversationId = req.params.id;
  const { tagId } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const assignment = await xprisma.conversationTagAssignment.findFirst({
    where: { conversationId, tagId },
  });

  if (!assignment) {
    return res.status(404).json({ error: 'Tag not assigned to this conversation' });
  }

  await xprisma.conversationTagAssignment.delete({
    where: { id: assignment.id },
  });

  return res.status(204).send();
});

// ── Contact Notes ─────────────────────────────────────────────

const CreateContactSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  tags: z.string().optional(),
  stage: z.string().optional(),
  igUsername: z.string().optional(),
  channel: z.string().optional(),
});

contactsRouter.get('/', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { search, stage, tag, channel, cursor } = req.query;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  const where: Record<string, unknown> = { workspaceId };

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

  if (channel) {
    where.channel = channel;
  }

  if (cursor) {
    where.lastMessageAt = { lt: new Date(cursor as string) };
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    take: limit + 1,
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const hasMore = contacts.length > limit;
  const data = hasMore ? contacts.slice(0, limit) : contacts;
  const nextCursor = hasMore && data.length > 0
    ? data[data.length - 1].lastMessageAt?.toISOString() || null
    : null;

  return res.json({
    success: true,
    data: { contacts: data, nextCursor, hasMore },
    contacts: data,
    nextCursor,
    hasMore,
  });
});

contactsRouter.post('/', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const parsed = CreateContactSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  // Check contact limit
  const limits = await getWorkspaceLimits(workspaceId);
  const contactCount = await prisma.contact.count({ where: { workspaceId } });
  if (!checkLimit(contactCount, limits.maxContacts)) {
    return res.status(403).json({
      error: 'Limit Reached',
      message: `You've reached the contacts limit for your current plan. Please upgrade to continue.`,
      limit: { current: contactCount, max: limits.maxContacts, resource: 'contacts' },
    });
  }

  const { name, phone, email, tags, stage, igUsername, channel } = parsed.data;

  try {
    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        name,
        phone,
        email: email || null,
        tags: tags || '',
        stage: stage || 'new',
        igUsername: igUsername || null,
        channel: channel || 'whatsapp',
      },
    });

    return res.status(201).json({
      success: true,
      data: { contact },
      contact,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Contact with this phone already exists' });
    }

    throw error;
  }
});

contactsRouter.patch('/:id', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;
  const { name, email, tags, stage, assignedToId, igUsername, channel, leadScore } = req.body;

  const contact = await prisma.contact.updateMany({
    where: { id, workspaceId },
    data: { name, email, tags, stage, assignedToId, igUsername, channel, leadScore },
  });

  if (contact.count === 0) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  return res.json({ success: true });
});

contactsRouter.delete('/:id', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const deleted = await prisma.contact.deleteMany({
    where: { id, workspaceId },
  });

  if (deleted.count === 0) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  return res.status(204).send();
});

// ── Contact Notes ─────────────────────────────────────────────

contactsRouter.get('/:id/notes', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const notes = await prisma.contactNote.findMany({
    where: { contactId: id, workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ notes });
});

contactsRouter.post('/:id/notes', async (req, res) => {
  const { workspaceId, userId } = req as unknown as AuthedRequest;
  const { id } = req.params;
  const { content, category, channel } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const note = await prisma.contactNote.create({
    data: {
      workspaceId,
      contactId: id,
      userId,
      content,
      category: category || 'general',
      channel: channel || null,
    },
  });

  return res.status(201).json({ note });
});

contactsRouter.patch('/:id/notes/:noteId', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { noteId } = req.params;
  const { content, category } = req.body;

  const updated = await prisma.contactNote.updateMany({
    where: { id: noteId, workspaceId },
    data: { content, category },
  });

  if (updated.count === 0) {
    return res.status(404).json({ error: 'Note not found' });
  }

  return res.json({ success: true });
});

contactsRouter.delete('/:id/notes/:noteId', async (req, res) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { noteId } = req.params;

  const deleted = await prisma.contactNote.deleteMany({
    where: { id: noteId, workspaceId },
  });

  if (deleted.count === 0) {
    return res.status(404).json({ error: 'Note not found' });
  }

  return res.status(204).send();
});

export default contactsRouter;
