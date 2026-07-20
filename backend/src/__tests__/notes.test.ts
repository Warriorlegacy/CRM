import request from 'supertest';
import app from '../server';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env';

describe('Notes API', () => {
  let token: string;
  let userId: string;
  let workspaceId: string;
  let contactId: string;
  let conversationId: string;

  beforeEach(async () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: `notes-test-${Date.now()}@example.com`,
        password: hashedPassword,
        name: 'Notes Test User',
      },
    });
    userId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Notes Test Workspace',
        slug: `notes-test-workspace-${Date.now()}`,
        ownerId: user.id,
      },
    });
    workspaceId = workspace.id;

    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'admin',
      },
    });

    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        phone: `+${Date.now() % 10000000000}`,
        name: 'Notes Test Contact',
        stage: 'new',
      },
    });
    contactId = contact.id;

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId,
        contactId,
        status: 'open',
      },
    });
    conversationId = conversation.id;

    token = jwt.sign({ userId: user.id, workspaceId: workspace.id }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  const headers = () => ({
    'Authorization': `Bearer ${token}`,
    'x-user-id': userId,
    'x-workspace-id': workspaceId,
  });

  // ─── HELPERS ───────────────────────────────────────────────────
  const createNote = async (overrides: Record<string, any> = {}) => {
    const response = await request(app)
      .post('/api/v1/notes')
      .set(headers())
      .send({
        conversationId,
        content: 'Test note content',
        priority: 'normal',
        mentions: [],
        ...overrides,
      });
    return response;
  };

  // ─── GET /api/v1/notes ─────────────────────────────────────────
  describe('GET /notes', () => {
    it('should return 400 when conversationId is missing', async () => {
      const response = await request(app)
        .get('/api/v1/notes')
        .set(headers());

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('conversationId');
    });

    it('should return empty array when no notes exist', async () => {
      const response = await request(app)
        .get(`/api/v1/notes?conversationId=${conversationId}`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.notes).toEqual([]);
    });

    it('should return notes for a conversation', async () => {
      await createNote({ content: 'First note' });
      await createNote({ content: 'Second note' });

      const response = await request(app)
        .get(`/api/v1/notes?conversationId=${conversationId}`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.notes).toHaveLength(2);
      expect(response.body.notes[0].content).toBe('Second note'); // newest first
    });

    it('should return notes with parsed mentions array', async () => {
      await createNote({
        content: 'Note with mentions',
        mentions: ['user-id-1', 'user-id-2'],
      });

      const response = await request(app)
        .get(`/api/v1/notes?conversationId=${conversationId}`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.notes).toHaveLength(1);
      expect(Array.isArray(response.body.notes[0].mentions)).toBe(true);
      expect(response.body.notes[0].mentions).toEqual(['user-id-1', 'user-id-2']);
    });

    it('should return notes with empty mentions array when none provided', async () => {
      await createNote({ mentions: [] });

      const response = await request(app)
        .get(`/api/v1/notes?conversationId=${conversationId}`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.notes[0].mentions)).toBe(true);
      expect(response.body.notes[0].mentions).toEqual([]);
    });

    it('should not return notes from other conversations', async () => {
      // Need a separate contact due to workspaceId+contactId unique constraint
      const otherContact = await prisma.contact.create({
        data: {
          workspaceId,
          phone: `+${Date.now()}0`,
          name: 'Other Contact',
          stage: 'new',
        },
      });
      const otherConvo = await prisma.conversation.create({
        data: {
          workspaceId,
          contactId: otherContact.id,
          status: 'open',
        },
      });

      await createNote({ conversationId: otherConvo.id, content: 'Other convo note' });

      const response = await request(app)
        .get(`/api/v1/notes?conversationId=${conversationId}`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.notes).toHaveLength(0);
    });
  });

  // ─── POST /api/v1/notes ────────────────────────────────────────
  describe('POST /notes', () => {
    it('should create a note with basic data', async () => {
      const response = await createNote({
        content: 'Newly created note',
        priority: 'high',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('Newly created note');
      expect(response.body.priority).toBe('high');
      expect(response.body.userId).toBe(userId);
    });

    it('should create a note with empty mentions array', async () => {
      const response = await createNote({
        content: 'Note without mentions',
        mentions: [],
      });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body.mentions)).toBe(true);
      expect(response.body.mentions).toEqual([]);
    });

    it('should create a note with multiple mentions and return as array', async () => {
      const response = await createNote({
        content: 'Note with team mentions',
        mentions: ['user-alpha', 'user-beta', 'user-gamma'],
      });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body.mentions)).toBe(true);
      expect(response.body.mentions).toHaveLength(3);
      expect(response.body.mentions).toEqual(['user-alpha', 'user-beta', 'user-gamma']);
    });

    it('should default mentions to empty array when omitted', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set(headers())
        .send({
          conversationId,
          content: 'Note with default mentions',
          priority: 'normal',
          // mentions omitted - should default to []
        });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body.mentions)).toBe(true);
      expect(response.body.mentions).toEqual([]);
    });

    it('should create a note with default priority', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set(headers())
        .send({
          conversationId,
          content: 'Default priority note',
          // priority omitted - should default to 'normal'
        });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('normal');
    });

    it('should return 400 for missing content', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set(headers())
        .send({
          conversationId,
          // content omitted
          priority: 'normal',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid priority', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set(headers())
        .send({
          conversationId,
          content: 'Invalid priority',
          priority: 'urgent', // not in enum
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set(headers())
        .send({
          conversationId: '00000000-0000-0000-0000-000000000000',
          content: 'Note for missing conversation',
          priority: 'normal',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Conversation not found');
    });

    it('should store mentions as JSON string in database', async () => {
      const response = await createNote({
        content: 'Mentions serialization test',
        mentions: ['alice', 'bob'],
      });

      // Verify the raw DB value is a JSON string
      const rawNote = await (prisma as any).conversationNote.findUnique({
        where: { id: response.body.id },
      });
      expect(typeof rawNote.mentions).toBe('string');
      expect(rawNote.mentions).toBe('["alice","bob"]');

      // Verify the API returns it as a parsed array
      expect(Array.isArray(response.body.mentions)).toBe(true);
      expect(response.body.mentions).toEqual(['alice', 'bob']);
    });
  });

  // ─── PATCH /api/v1/notes/:id ───────────────────────────────────
  describe('PATCH /notes/:id', () => {
    it('should update note content', async () => {
      const createRes = await createNote({ content: 'Original content' });
      const noteId = createRes.body.id;

      const response = await request(app)
        .patch(`/api/v1/notes/${noteId}`)
        .set(headers())
        .send({ content: 'Updated content' });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Updated content');
    });

    it('should update note priority', async () => {
      const createRes = await createNote({ priority: 'low' });
      const noteId = createRes.body.id;

      const response = await request(app)
        .patch(`/api/v1/notes/${noteId}`)
        .set(headers())
        .send({ priority: 'high' });

      expect(response.status).toBe(200);
      expect(response.body.priority).toBe('high');
    });

    it('should update mentions and return parsed array', async () => {
      const createRes = await createNote({
        content: 'Note to update mentions',
        mentions: ['original-mention'],
      });
      const noteId = createRes.body.id;

      const response = await request(app)
        .patch(`/api/v1/notes/${noteId}`)
        .set(headers())
        .send({ mentions: ['updated-mention-1', 'updated-mention-2'] });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.mentions)).toBe(true);
      expect(response.body.mentions).toEqual(['updated-mention-1', 'updated-mention-2']);

      // Verify it's stored as JSON string in DB
      const rawNote = await (prisma as any).conversationNote.findUnique({
        where: { id: noteId },
      });
      expect(rawNote.mentions).toBe('["updated-mention-1","updated-mention-2"]');
    });

    it('should clear mentions when updating to empty array', async () => {
      const createRes = await createNote({
        content: 'Note to clear mentions',
        mentions: ['some-mention'],
      });
      const noteId = createRes.body.id;

      const response = await request(app)
        .patch(`/api/v1/notes/${noteId}`)
        .set(headers())
        .send({ mentions: [] });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.mentions)).toBe(true);
      expect(response.body.mentions).toEqual([]);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .patch('/api/v1/notes/00000000-0000-0000-0000-000000000000')
        .set(headers())
        .send({ content: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should not update notes from other workspaces', async () => {
      const createRes = await createNote({ content: 'Private note' });
      const noteId = createRes.body.id;

      // Create another workspace and user (must be a workspace member)
      const otherUser = await prisma.user.create({
        data: {
          email: `other-notes-${Date.now()}@example.com`,
          password: bcrypt.hashSync('password123', 10),
          name: 'Other User',
        },
      });

      const otherWorkspace = await prisma.workspace.create({
        data: {
          name: 'Other Workspace',
          slug: `other-notes-${Date.now()}`,
          ownerId: otherUser.id,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          userId: otherUser.id,
          workspaceId: otherWorkspace.id,
          role: 'admin',
        },
      });

      const otherToken = jwt.sign(
        { userId: otherUser.id, workspaceId: otherWorkspace.id },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .patch(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .set('x-user-id', otherUser.id)
        .set('x-workspace-id', otherWorkspace.id)
        .send({ content: 'Hacked content' });

      expect(response.status).toBe(404);
    });
  });

  // ─── DELETE /api/v1/notes/:id ──────────────────────────────────
  describe('DELETE /notes/:id', () => {
    it('should delete a note', async () => {
      const createRes = await createNote({ content: 'To be deleted' });
      const noteId = createRes.body.id;

      const response = await request(app)
        .delete(`/api/v1/notes/${noteId}`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);

      // Verify it's gone
      const getRes = await request(app)
        .get(`/api/v1/notes?conversationId=${conversationId}`)
        .set(headers());
      expect(getRes.body.notes).toHaveLength(0);
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .delete('/api/v1/notes/00000000-0000-0000-0000-000000000000')
        .set(headers());

      expect(response.status).toBe(404);
    });

    it('should not delete notes from other workspaces', async () => {
      const createRes = await createNote({ content: 'Private note' });
      const noteId = createRes.body.id;

      // Other workspace user (must be a workspace member)
      const otherUser = await prisma.user.create({
        data: {
          email: `other-delete-${Date.now()}@example.com`,
          password: bcrypt.hashSync('password123', 10),
          name: 'Other User',
        },
      });
      const otherWorkspace = await prisma.workspace.create({
        data: {
          name: 'Other WS',
          slug: `other-delete-${Date.now()}`,
          ownerId: otherUser.id,
        },
      });
      await prisma.workspaceMember.create({
        data: {
          userId: otherUser.id,
          workspaceId: otherWorkspace.id,
          role: 'admin',
        },
      });
      const otherToken = jwt.sign(
        { userId: otherUser.id, workspaceId: otherWorkspace.id },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .delete(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .set('x-user-id', otherUser.id)
        .set('x-workspace-id', otherWorkspace.id);

      expect(response.status).toBe(404);

      // Verify note still exists
      const getRes = await request(app)
        .get(`/api/v1/notes?conversationId=${conversationId}`)
        .set(headers());
      expect(getRes.body.notes).toHaveLength(1);
    });
  });
});
