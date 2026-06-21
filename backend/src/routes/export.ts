import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

export const exportRouter = Router();

exportRouter.get('/contacts/csv', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { stage, search } = req.query;

  const where: any = { workspaceId };

  if (stage && stage !== 'all') {
    where.stage = stage;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { phone: { contains: search as string } },
      { email: { contains: search as string } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      stage: true,
      tags: true,
      createdAt: true,
      lastMessageAt: true,
      assignedTo: {
        select: { name: true },
      },
    },
  });

  const csvHeader = 'Name,Phone,Email,Stage,Tags,Assigned To,Created At,Last Message\n';
  const csvRows = contacts.map(c => 
    `"${c.name || ''}","${c.phone}","${c.email || ''}","${c.stage}","${c.tags || ''}","${c.assignedTo?.name || ''}","${c.createdAt}","${c.lastMessageAt || ''}"`
  ).join('\n');

  const csv = csvHeader + csvRows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=contacts-${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
});

exportRouter.get('/conversations/csv', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { status } = req.query;

  const where: any = { workspaceId };
  if (status && status !== 'all') {
    where.status = status;
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      contact: {
        select: {
          name: true,
          phone: true,
          email: true,
          stage: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { bodyText: true, createdAt: true },
      },
    },
  });

  const csvHeader = 'Contact Name,Phone,Email,Stage,Status,Last Message,Last Activity\n';
  const csvRows = conversations.map(c => 
    `"${c.contact.name || ''}","${c.contact.phone}","${c.contact.email || ''}","${c.contact.stage}","${c.status}","${c.messages[0]?.bodyText?.replace(/"/g, '""') || ''}","${c.updatedAt}"`
  ).join('\n');

  const csv = csvHeader + csvRows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=conversations-${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
});

exportRouter.get('/messages/csv', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { conversationId, direction, days } = req.query;

  const where: any = { workspaceId };

  if (conversationId) {
    where.conversationId = conversationId as string;
  }

  if (direction && direction !== 'all') {
    where.direction = direction;
  }

  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));
    where.createdAt = { gte: startDate };
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000,
    include: {
      contact: {
        select: { name: true, phone: true },
      },
      sentByUser: {
        select: { name: true },
      },
    },
  });

  const csvHeader = 'Date,Contact Name,Phone,Direction,Type,Message,Sent By\n';
  const csvRows = messages.map(m => 
    `"${m.createdAt}","${m.contact.name || ''}","${m.contact.phone}","${m.direction}","${m.type}","${m.bodyText?.replace(/"/g, '""') || ''}","${m.sentByUser?.name || 'Customer'}"`
  ).join('\n');

  const csv = csvHeader + csvRows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=messages-${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
});

export default exportRouter;
