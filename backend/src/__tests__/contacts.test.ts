import request from 'supertest';
import app from '../server';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env';

describe('Contacts API', () => {
  let token: string;
  let userId: string;
  let workspaceId: string;

  beforeEach(async () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'contacts-test999@example.com',
        password: hashedPassword,
        name: 'Contacts Test User',
      },
    });
    userId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Contacts Test Workspace',
        slug: 'contacts-test-workspace-999',
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

    token = jwt.sign({ userId: user.id, workspaceId: workspace.id }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  const headers = () => ({
    'Authorization': `Bearer ${token}`,
    'x-user-id': userId,
    'x-workspace-id': workspaceId,
  });

  describe('GET /contacts', () => {
    beforeEach(async () => {
      await prisma.contact.create({
        data: {
          workspaceId,
          phone: '+1234567890',
          name: 'John Doe',
          stage: 'new',
          tags: 'lead',
        },
      });
      await prisma.contact.create({
        data: {
          workspaceId,
          phone: '+0987654321',
          name: 'Jane Smith',
          stage: 'followup',
          tags: 'customer',
        },
      });
    });

    it('should return all contacts for workspace', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contacts).toHaveLength(2);
    });

    it('should filter contacts by stage', async () => {
      const response = await request(app)
        .get('/api/v1/contacts?stage=new')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.data.contacts).toHaveLength(1);
      expect(response.body.data.contacts[0].stage).toBe('new');
    });

    it('should search contacts by name', async () => {
      const response = await request(app)
        .get('/api/v1/contacts?search=John')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.data.contacts).toHaveLength(1);
      expect(response.body.data.contacts[0].name).toBe('John Doe');
    });

    it('should return empty array for non-matching search', async () => {
      const response = await request(app)
        .get('/api/v1/contacts?search=NonExistent')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.data.contacts).toHaveLength(0);
    });
  });

  describe('POST /contacts', () => {
    it('should create a new contact', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set(headers())
        .send({
          phone: '+1111111111',
          name: 'New Contact',
          stage: 'new',
          tags: 'lead',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contact).toHaveProperty('phone', '+1111111111');
    });

    it('should return 400 for missing phone', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set(headers())
        .send({
          name: 'No Phone Contact',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for duplicate phone', async () => {
      await request(app)
        .post('/api/v1/contacts')
        .set(headers())
        .send({
          phone: '+2222222222',
          name: 'First Contact',
        });

      const response = await request(app)
        .post('/api/v1/contacts')
        .set(headers())
        .send({
          phone: '+2222222222',
          name: 'Second Contact',
        });

      expect(response.status).toBe(400);
    });

    it('should create contact with minimal data', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set(headers())
        .send({
          phone: '+3333333333',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.contact).toHaveProperty('phone', '+3333333333');
    });
  });

  describe('PATCH /contacts/:id', () => {
    it('should update a contact', async () => {
      const createResponse = await request(app)
        .post('/api/v1/contacts')
        .set(headers())
        .send({
          phone: '+4444444444',
          name: 'Original Name',
        });

      const contactId = createResponse.body.data.contact.id;

      const response = await request(app)
        .patch(`/api/v1/contacts/${contactId}`)
        .set(headers())
        .send({
          name: 'Updated Name',
          stage: 'followup',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .patch('/api/v1/contacts/non-existent-id')
        .set(headers())
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /contacts/:id', () => {
    it('should delete a contact', async () => {
      const createResponse = await request(app)
        .post('/api/v1/contacts')
        .set(headers())
        .send({
          phone: '+5555555555',
          name: 'To Delete',
        });

      const contactId = createResponse.body.data.contact.id;

      const response = await request(app)
        .delete(`/api/v1/contacts/${contactId}`)
        .set(headers());

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .delete('/api/v1/contacts/non-existent-id')
        .set(headers());

      expect(response.status).toBe(404);
    });

    it('should not delete contacts from other workspaces', async () => {
      // Create contact in this workspace
      const createResponse = await request(app)
        .post('/api/v1/contacts')
        .set(headers())
        .send({
          phone: '+6666666666',
          name: 'Workspace Contact',
        });

      const contactId = createResponse.body.data.contact.id;

      // Create another workspace and user
      const hashedPassword = bcrypt.hashSync('password123', 10);
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-workspace@example.com',
          password: hashedPassword,
          name: 'Other User',
        },
      });

      const otherWorkspace = await prisma.workspace.create({
        data: {
          name: 'Other Workspace',
          slug: `other-workspace-${Date.now()}`,
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

      // Try to delete from other workspace
      const response = await request(app)
        .delete(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .set('x-user-id', otherUser.id)
        .set('x-workspace-id', otherWorkspace.id);

      expect(response.status).toBe(404);

      // Verify contact still exists
      const verifyResponse = await request(app)
        .get('/api/v1/contacts')
        .set(headers());

      expect(verifyResponse.body.data.contacts).toHaveLength(1);
    });
  });
});

// ─── Conversation Tags API ──────────────────────────────────────────

describe('Conversation Tags API', () => {
  let token: string;
  let userId: string;
  let workspaceId: string;
  let contactId: string;
  let conversationId: string;

  // Use `as any` so that tests compile before running `prisma generate`
  // after the ConversationTag schema migration is applied.
  const xprisma = prisma as any;

  beforeEach(async () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: `tags-test-${Date.now()}@example.com`,
        password: hashedPassword,
        name: 'Tags Test User',
      },
    });
    userId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: `Tags Workspace ${Date.now()}`,
        slug: `tags-workspace-${Date.now()}`,
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

    token = jwt.sign({ userId: user.id, workspaceId: workspace.id }, env.JWT_SECRET, { expiresIn: '1h' });

    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        phone: `+${Date.now() % 10000000000}`,
        name: 'Tag Test Contact',
        stage: 'new',
      },
    });
    contactId = contact.id;

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId,
        contactId: contact.id,
        channel: 'whatsapp',
        status: 'open',
      },
    });
    conversationId = conversation.id;
  });

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    'x-user-id': userId,
    'x-workspace-id': workspaceId,
  });

  describe('GET /contacts/conversations/tags', () => {
    it('should return empty array when no tags exist', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/conversations/tags')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual([]);
    });

    it('should return all tags for workspace', async () => {
      await xprisma.conversationTag.create({
        data: { workspaceId, name: 'Hot', color: '#ff0000' },
      });
      await xprisma.conversationTag.create({
        data: { workspaceId, name: 'Cold', color: '#0000ff' },
      });

      const response = await request(app)
        .get('/api/v1/contacts/conversations/tags')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.tags).toHaveLength(2);
      expect(response.body.tags.map((t: any) => t.name).sort()).toEqual(['Cold', 'Hot']);
    });

    it('should return tags with assignment counts', async () => {
      const tag = await xprisma.conversationTag.create({
        data: { workspaceId, name: 'VIP' },
      });

      await xprisma.conversationTagAssignment.create({
        data: {
          workspaceId,
          conversationId,
          tagId: tag.id,
        },
      });

      const response = await request(app)
        .get('/api/v1/contacts/conversations/tags')
        .set(headers());

      expect(response.status).toBe(200);
      const vipTag = response.body.tags.find((t: any) => t.name === 'VIP');
      expect(vipTag).toBeDefined();
      expect(vipTag._count.assignments).toBe(1);
    });
  });

  describe('POST /contacts/conversations/tags', () => {
    it('should create a new tag', async () => {
      const response = await request(app)
        .post('/api/v1/contacts/conversations/tags')
        .set(headers())
        .send({ name: 'Priority', color: '#10b981' });

      expect(response.status).toBe(201);
      expect(response.body.tag).toHaveProperty('name', 'Priority');
      expect(response.body.tag).toHaveProperty('color', '#10b981');
    });

    it('should reject duplicate tag names within workspace', async () => {
      await xprisma.conversationTag.create({
        data: { workspaceId, name: 'UniqueTag' },
      });

      const response = await request(app)
        .post('/api/v1/contacts/conversations/tags')
        .set(headers())
        .send({ name: 'UniqueTag' });

      expect(response.status).toBe(400);
    });

    it('should use default color if none provided', async () => {
      const response = await request(app)
        .post('/api/v1/contacts/conversations/tags')
        .set(headers())
        .send({ name: 'DefaultColor' });

      expect(response.status).toBe(201);
      expect(response.body.tag.color).toBe('#6366f1');
    });
  });

  describe('DELETE /contacts/conversations/tags/:tagId', () => {
    it('should delete a tag and its assignments', async () => {
      const tag = await xprisma.conversationTag.create({
        data: { workspaceId, name: 'ToDelete' },
      });

      await xprisma.conversationTagAssignment.create({
        data: { workspaceId, conversationId, tagId: tag.id },
      });

      const response = await request(app)
        .delete(`/api/v1/contacts/conversations/tags/${tag.id}`)
        .set(headers());

      expect(response.status).toBe(204);

      const tagsResponse = await request(app)
        .get('/api/v1/contacts/conversations/tags')
        .set(headers());

      expect(tagsResponse.body.tags.find((t: any) => t.id === tag.id)).toBeUndefined();
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .delete('/api/v1/contacts/conversations/tags/non-existent-id')
        .set(headers());

      expect(response.status).toBe(404);
    });
  });

  describe('POST /contacts/conversations/:id/tags', () => {
    it('should assign a tag to a conversation', async () => {
      const tag = await xprisma.conversationTag.create({
        data: { workspaceId, name: 'AssignedTag' },
      });

      const response = await request(app)
        .post(`/api/v1/contacts/conversations/${conversationId}/tags`)
        .set(headers())
        .send({ tagId: tag.id });

      expect(response.status).toBe(201);
      expect(response.body.assignment).toHaveProperty('tagId', tag.id);
      expect(response.body.assignment).toHaveProperty('conversationId', conversationId);
    });

    it('should reject assignment from another workspace tag', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: {
          name: 'Other WS',
          slug: `other-ws-${Date.now()}`,
          ownerId: userId,
        },
      });
      const otherTag = await xprisma.conversationTag.create({
        data: { workspaceId: otherWorkspace.id, name: 'OtherTag' },
      });

      const response = await request(app)
        .post(`/api/v1/contacts/conversations/${conversationId}/tags`)
        .set(headers())
        .send({ tagId: otherTag.id });

      expect(response.status).toBe(404);
    });

    it('should reject when tagId is missing', async () => {
      const response = await request(app)
        .post(`/api/v1/contacts/conversations/${conversationId}/tags`)
        .set(headers())
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /contacts/conversations/:id/tags/:tagId', () => {
    it('should remove a tag from a conversation', async () => {
      const tag = await xprisma.conversationTag.create({
        data: { workspaceId, name: 'RemoveMe' },
      });

      await xprisma.conversationTagAssignment.create({
        data: { workspaceId, conversationId, tagId: tag.id },
      });

      const response = await request(app)
        .delete(`/api/v1/contacts/conversations/${conversationId}/tags/${tag.id}`)
        .set(headers());

      expect(response.status).toBe(204);

      const assignments = await xprisma.conversationTagAssignment.findMany({
        where: { conversationId, tagId: tag.id },
      });
      expect(assignments).toHaveLength(0);
    });

    it('should return 404 for non-assigned tag', async () => {
      const tag = await xprisma.conversationTag.create({
        data: { workspaceId, name: 'NeverAssigned' },
      });

      const response = await request(app)
        .delete(`/api/v1/contacts/conversations/${conversationId}/tags/${tag.id}`)
        .set(headers());

      expect(response.status).toBe(404);
    });
  });
});
