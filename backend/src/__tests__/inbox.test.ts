import request from 'supertest';
import app from '../server';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

describe('Inbox API', () => {
  let token: string;
  let userId: string;
  let workspaceId: string;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'inbox-test999@example.com',
        password: hashedPassword,
        name: 'Inbox Test User',
      },
    });
    userId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Inbox Test Workspace',
        slug: 'inbox-test-workspace-999',
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

  describe('GET /inbox/conversations', () => {
    beforeEach(async () => {
      const contact1 = await prisma.contact.create({
        data: {
          workspaceId,
          phone: '+1234567890',
          name: 'Conversation 1',
          stage: 'new',
        },
      });

      const contact2 = await prisma.contact.create({
        data: {
          workspaceId,
          phone: '+0987654321',
          name: 'Conversation 2',
          stage: 'followup',
        },
      });

      await prisma.conversation.create({
        data: {
          workspaceId,
          contactId: contact1.id,
          status: 'open',
        },
      });

      await prisma.conversation.create({
        data: {
          workspaceId,
          contactId: contact2.id,
          status: 'closed',
        },
      });
    });

    it('should return all conversations', async () => {
      const response = await request(app)
        .get('/api/v1/inbox/conversations')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.conversations).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/inbox/conversations?status=open')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.data.conversations).toHaveLength(1);
      expect(response.body.data.conversations[0].status).toBe('open');
    });
  });

  describe('GET /inbox/unread-counts', () => {
    beforeEach(async () => {
      const contact = await prisma.contact.create({
        data: {
          workspaceId,
          phone: '+4444444444',
          name: 'Unread Contact',
          stage: 'new',
          unreadCount: 5,
        },
      });

      await prisma.conversation.create({
        data: {
          workspaceId,
          contactId: contact.id,
          status: 'open',
        },
      });
    });

    it('should return unread counts', async () => {
      const response = await request(app)
        .get('/api/v1/inbox/unread-counts')
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUnread).toBe(5);
    });
  });
});
