import request from 'supertest';
import app from '../server';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env';

describe('Messages API', () => {
  let token: string;
  let userId: string;
  let workspaceId: string;
  let contactId: string;
  let conversationId: string;

  beforeEach(async () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'messages-test999@example.com',
        password: hashedPassword,
        name: 'Messages Test User',
      },
    });
    userId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Messages Test Workspace',
        slug: `messages-test-workspace-${Date.now()}`,
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
        name: 'Message Test Contact',
        stage: 'new',
      },
    });
    contactId = contact.id;

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId,
        contactId,
        status: 'open',
        channel: 'whatsapp',
      },
    });
    conversationId = conversation.id;

    // Create a WA account for sending messages
    await prisma.waAccount.create({
      data: {
        workspaceId,
        phoneNumberId: 'test-phone-id',
        accessToken: 'test-access-token',
        businessAccountId: 'test-ba-id',
        webhookVerifyToken: 'test-webhook-token',
      },
    });

    token = jwt.sign({ userId: user.id, workspaceId: workspace.id }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  const headers = () => ({
    'Authorization': `Bearer ${token}`,
    'x-user-id': userId,
    'x-workspace-id': workspaceId,
  });

  describe('POST /messages/send', () => {
    it('should return 400 for missing conversationId', async () => {
      const response = await request(app)
        .post('/api/v1/messages/send')
        .set(headers())
        .send({
          text: 'Hello',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/v1/messages/send')
        .set(headers())
        .send({
          conversationId,
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app)
        .post('/api/v1/messages/send')
        .set(headers())
        .send({
          conversationId: 'non-existent-conversation',
          text: 'Hello',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /inbox/conversations/:id/messages', () => {
    beforeEach(async () => {
      // Create some messages
      await prisma.message.create({
        data: {
          workspaceId,
          conversationId,
          contactId,
          direction: 'inbound',
          type: 'text',
          bodyText: 'Inbound message 1',
        },
      });

      await prisma.message.create({
        data: {
          workspaceId,
          conversationId,
          contactId,
          direction: 'outbound',
          type: 'text',
          bodyText: 'Outbound message 1',
        },
      });
    });

    it('should return messages for a conversation', async () => {
      const response = await request(app)
        .get(`/api/v1/inbox/conversations/${conversationId}/messages`)
        .set(headers());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(2);
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app)
        .get('/api/v1/inbox/conversations/non-existent/messages')
        .set(headers());

      expect(response.status).toBe(404);
    });

    it('should not return messages from other workspaces', async () => {
      // Create another workspace
      const hashedPassword = bcrypt.hashSync('password123', 10);
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-msg-workspace@example.com',
          password: hashedPassword,
          name: 'Other User',
        },
      });

      const otherWorkspace = await prisma.workspace.create({
        data: {
          name: 'Other Msg Workspace',
          slug: `other-msg-workspace-${Date.now()}`,
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
        .get(`/api/v1/inbox/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${otherToken}`)
        .set('x-user-id', otherUser.id)
        .set('x-workspace-id', otherWorkspace.id);

      expect(response.status).toBe(404);
    });
  });
});
