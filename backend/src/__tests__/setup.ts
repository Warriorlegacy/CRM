import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  await prisma.readReceipt.deleteMany({});
  await prisma.typingIndicator.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.followup.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.waAccount.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});
});

export const createTestUser = async (email: string = 'test@example.com', password: string = 'password123') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: 'Test User',
    },
  });
};

export const createTestWorkspace = async (ownerId: string, name: string = 'Test Workspace') => {
  return prisma.workspace.create({
    data: {
      name,
      slug: `workspace-${Date.now()}`,
      ownerId,
    },
  });
};

export const createTestWorkspaceMember = async (userId: string, workspaceId: string, role: string = 'agent') => {
  return prisma.workspaceMember.create({
    data: {
      userId,
      workspaceId,
      role,
    },
  });
};

export const createTestContact = async (workspaceId: string, phone: string = '+1234567890', name: string = 'Test Contact') => {
  return prisma.contact.create({
    data: {
      workspaceId,
      phone,
      name,
      stage: 'new',
      tags: '',
    },
  });
};

export const createTestConversation = async (workspaceId: string, contactId: string) => {
  return prisma.conversation.create({
    data: {
      workspaceId,
      contactId,
      status: 'open',
    },
  });
};

export const createTestMessage = async (
  workspaceId: string,
  conversationId: string,
  contactId: string,
  direction: string = 'inbound',
  bodyText: string = 'Test message'
) => {
  return prisma.message.create({
    data: {
      workspaceId,
      conversationId,
      contactId,
      direction,
      type: 'text',
      bodyText,
    },
  });
};

export const generateTestToken = (userId: string, workspaceId: string): string => {
  const jwt = require('jsonwebtoken');
  const { env } = require('../env');
  return jwt.sign({ userId, workspaceId }, env.JWT_SECRET, { expiresIn: '1h' });
};
