import request from 'supertest';
import app from '../server';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

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

    const jwt = require('jsonwebtoken');
    const { env } = require('../env');
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
  });
});
