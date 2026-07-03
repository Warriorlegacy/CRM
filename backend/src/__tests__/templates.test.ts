import request from 'supertest';
import app from '../server';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env';

describe('Templates API', () => {
  let token: string;
  let userId: string;
  let workspaceId: string;

  beforeEach(async () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'templates-test999@example.com',
        password: hashedPassword,
        name: 'Templates Test User',
      },
    });
    userId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Templates Test Workspace',
        slug: 'templates-test-workspace-999',
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

  describe('GET /templates', () => {
    beforeEach(async () => {
      await prisma.template.create({
        data: {
          workspaceId,
          title: 'Greeting',
          body: 'Hello {name}! Welcome to our service.',
        },
      });
      await prisma.template.create({
        data: {
          workspaceId,
          title: 'Follow up',
          body: 'Hi {name}, just following up on our conversation.',
        },
      });
    });

    it('should return all templates', async () => {
      const response = await request(app)
        .get('/api/v1/templates')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toHaveLength(2);
    });

    it('should return templates ordered by creation date', async () => {
      const response = await request(app)
        .get('/api/v1/templates')
        .set(headers());

      expect(response.status).toBe(200);
      const templates = response.body.data.templates;
      expect(templates[0].title).toBe('Follow up');
      expect(templates[1].title).toBe('Greeting');
    });
  });

  describe('POST /templates', () => {
    it('should create a new template', async () => {
      const response = await request(app)
        .post('/api/v1/templates')
        .set(headers())
        .send({
          title: 'New Template',
          body: 'This is a new template with {variable}.',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toHaveProperty('title', 'New Template');
    });

    it('should return 400 for missing title', async () => {
      const response = await request(app)
        .post('/api/v1/templates')
        .set(headers())
        .send({
          body: 'Template body without title',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing body', async () => {
      const response = await request(app)
        .post('/api/v1/templates')
        .set(headers())
        .send({
          title: 'Template without body',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty title', async () => {
      const response = await request(app)
        .post('/api/v1/templates')
        .set(headers())
        .send({
          title: '',
          body: 'Some body',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /templates/:id', () => {
    it('should update a template', async () => {
      const createResponse = await request(app)
        .post('/api/v1/templates')
        .set(headers())
        .send({
          title: 'Original Title',
          body: 'Original Body',
        });

      const templateId = createResponse.body.data.template.id;

      const response = await request(app)
        .patch(`/api/v1/templates/${templateId}`)
        .set(headers())
        .send({
          title: 'Updated Title',
          body: 'Updated Body',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .patch('/api/v1/templates/non-existent-id')
        .set(headers())
        .send({
          title: 'Updated Title',
          body: 'Updated Body',
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid update data', async () => {
      const createResponse = await request(app)
        .post('/api/v1/templates')
        .set(headers())
        .send({
          title: 'Test Template',
          body: 'Test Body',
        });

      const templateId = createResponse.body.data.template.id;

      const response = await request(app)
        .patch(`/api/v1/templates/${templateId}`)
        .set(headers())
        .send({
          title: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /templates/:id', () => {
    it('should delete a template', async () => {
      const createResponse = await request(app)
        .post('/api/v1/templates')
        .set(headers())
        .send({
          title: 'To Delete',
          body: 'Delete me',
        });

      const templateId = createResponse.body.data.template.id;

      const response = await request(app)
        .delete(`/api/v1/templates/${templateId}`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deleted
      const getResponse = await request(app)
        .get('/api/v1/templates')
        .set(headers());

      expect(getResponse.body.data.templates).toHaveLength(0);
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .delete('/api/v1/templates/non-existent-id')
        .set(headers());

      expect(response.status).toBe(404);
    });
  });
});
