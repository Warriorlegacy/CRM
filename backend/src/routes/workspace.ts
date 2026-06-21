import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { PLAN_LIMITS } from '../middleware/limits';

export const workspaceRouter = Router();

workspaceRouter.get('/', async (req, res) => {
  const userId = (req as any).userId;

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      wa: true,
      ig: true,
    },
  });

  return res.json({ ok: true, workspaces });
});

workspaceRouter.post('/', async (req, res) => {
  const userId = (req as any).userId;
  const { name } = req.body;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: 'admin',
        },
      },
    },
  });

  return res.json({ ok: true, workspace });
});

workspaceRouter.get('/current', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      wa: true,
      ig: true,
    },
  });

  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  return res.json({ ok: true, workspace });
});

workspaceRouter.post('/wa-account', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { phoneNumberId, businessAccountId, accessToken, webhookVerifyToken } = req.body;

  const wa = await prisma.waAccount.upsert({
    where: { workspaceId },
    update: {
      phoneNumberId,
      businessAccountId,
      accessToken,
      webhookVerifyToken,
    },
    create: {
      workspaceId,
      phoneNumberId,
      businessAccountId,
      accessToken,
      webhookVerifyToken,
    },
  });

  return res.json({ ok: true, wa });
});

workspaceRouter.post('/ig-account', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { igUserId, accessToken, webhookVerifyToken } = req.body;

  const ig = await prisma.igAccount.upsert({
    where: { workspaceId },
    update: {
      igUserId,
      accessToken,
      webhookVerifyToken,
    },
    create: {
      workspaceId,
      igUserId,
      accessToken,
      webhookVerifyToken,
    },
  });

  return res.json({ ok: true, ig });
});

workspaceRouter.get('/billing', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true, createdAt: true },
  });
  
  const limits = PLAN_LIMITS[workspace?.plan || 'free'];
  
  const [contactCount, userCount, flowCount] = await Promise.all([
    prisma.contact.count({ where: { workspaceId } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.chatbotFlow.count({ where: { workspaceId } }),
  ]);
  
  return res.json({
    plan: workspace?.plan || 'free',
    limits,
    usage: {
      contacts: contactCount,
      users: userCount,
      chatbotFlows: flowCount,
    },
    createdAt: workspace?.createdAt,
  });
});

export default workspaceRouter;
