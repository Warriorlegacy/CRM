import request from 'supertest';
import app from '../server';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

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

    const jwt = require('jsonwebtoken');
    const { env } = require('../env');
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
  });
});
