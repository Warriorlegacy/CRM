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
