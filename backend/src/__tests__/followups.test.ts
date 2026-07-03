import request from 'supertest';
import app from '../server';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env';

describe('Followups API', () => {
  let token: string;
  let userId: string;
  let workspaceId: string;
  let contactId: string;

  beforeEach(async () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'followups-test999@example.com',
        password: hashedPassword,
        name: 'Followups Test User',
      },
    });
    userId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Followups Test Workspace',
        slug: `followups-test-workspace-${Date.now()}`,
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
        phone: '+1234567890',
        name: 'Followup Test Contact',
        stage: 'new',
      },
    });
    contactId = contact.id;

    token = jwt.sign({ userId: user.id, workspaceId: workspace.id }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  const headers = () => ({
    'Authorization': `Bearer ${token}`,
    'x-user-id': userId,
    'x-workspace-id': workspaceId,
  });

  describe('GET /followups', () => {
    beforeEach(async () => {
      await prisma.followup.create({
        data: {
          workspaceId,
          contactId,
          dueAt: new Date(Date.now() + 86400000), // tomorrow
          note: 'Follow up tomorrow',
          status: 'pending',
        },
      });
      await prisma.followup.create({
        data: {
          workspaceId,
          contactId,
          dueAt: new Date(Date.now() - 86400000), // yesterday
          note: 'Overdue followup',
          status: 'pending',
        },
      });
      await prisma.followup.create({
        data: {
          workspaceId,
          contactId,
          dueAt: new Date(),
          note: 'Completed followup',
          status: 'completed',
        },
      });
    });

    it('should return all followups', async () => {
      const response = await request(app)
        .get('/api/v1/followups')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.followups).toHaveLength(3);
      expect(response.body.stats).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/followups?status=pending')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.followups).toHaveLength(2);
    });

    it('should filter overdue followups', async () => {
      const response = await request(app)
        .get('/api/v1/followups?overdue=true')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.followups).toHaveLength(1);
      expect(response.body.followups[0].note).toBe('Overdue followup');
    });

    it('should return stats', async () => {
      const response = await request(app)
        .get('/api/v1/followups')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.stats).toHaveProperty('total');
      expect(response.body.stats).toHaveProperty('overdue');
      expect(response.body.stats).toHaveProperty('today');
    });
  });

  describe('POST /followups', () => {
    it('should create a new followup', async () => {
      const dueAt = new Date(Date.now() + 86400000).toISOString();
      const response = await request(app)
        .post('/api/v1/followups')
        .set(headers())
        .send({
          contactId,
          dueAt,
          note: 'Test followup',
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.followup).toHaveProperty('id');
      expect(response.body.followup.status).toBe('pending');
    });

    it('should return 400 for missing contactId', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set(headers())
        .send({
          dueAt: new Date().toISOString(),
          note: 'No contact',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing dueAt', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set(headers())
        .send({
          contactId,
          note: 'No due date',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /followups/:id', () => {
    it('should update a followup', async () => {
      const createResponse = await request(app)
        .post('/api/v1/followups')
        .set(headers())
        .send({
          contactId,
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          note: 'Original note',
        });

      const followupId = createResponse.body.followup.id;

      const response = await request(app)
        .patch(`/api/v1/followups/${followupId}`)
        .set(headers())
        .send({
          note: 'Updated note',
          status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return 404 for non-existent followup', async () => {
      const response = await request(app)
        .patch('/api/v1/followups/non-existent-id')
        .set(headers())
        .send({
          note: 'Updated',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /followups/:id/done', () => {
    it('should mark followup as completed', async () => {
      const createResponse = await request(app)
        .post('/api/v1/followups')
        .set(headers())
        .send({
          contactId,
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          note: 'To complete',
        });

      const followupId = createResponse.body.followup.id;

      const response = await request(app)
        .patch(`/api/v1/followups/${followupId}/done`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.followup.status).toBe('completed');
    });

    it('should return 404 for non-existent followup', async () => {
      const response = await request(app)
        .patch('/api/v1/followups/non-existent-id/done')
        .set(headers());

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /followups/:id/cancel', () => {
    it('should cancel a followup', async () => {
      const createResponse = await request(app)
        .post('/api/v1/followups')
        .set(headers())
        .send({
          contactId,
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          note: 'To cancel',
        });

      const followupId = createResponse.body.followup.id;

      const response = await request(app)
        .patch(`/api/v1/followups/${followupId}/cancel`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return 404 for non-existent followup', async () => {
      const response = await request(app)
        .patch('/api/v1/followups/non-existent-id/cancel')
        .set(headers());

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /followups/:id', () => {
    it('should delete a followup', async () => {
      const createResponse = await request(app)
        .post('/api/v1/followups')
        .set(headers())
        .send({
          contactId,
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          note: 'To delete',
        });

      const followupId = createResponse.body.followup.id;

      const response = await request(app)
        .delete(`/api/v1/followups/${followupId}`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should return 404 for non-existent followup', async () => {
      const response = await request(app)
        .delete('/api/v1/followups/non-existent-id')
        .set(headers());

      expect(response.status).toBe(404);
    });
  });
});
