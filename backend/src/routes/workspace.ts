import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { PLAN_LIMITS } from '../middleware/limits';

export const workspaceRouter = Router();

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type DayKey = typeof DAY_KEYS[number];

const BusinessHoursSchema = z.object({
  enabled: z.boolean().default(false),
  hours: z.record(z.array(z.string())).optional(),
});

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
  try {
    const workspaceId = (req as any).workspaceId;
    const userId = (req as any).userId;

    let workspace = workspaceId
      ? await prisma.workspace.findUnique({
          where: { id: workspaceId },
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            wa: true,
            ig: true,
          },
        })
      : null;

    if (!workspace && userId) {
      workspace = await prisma.workspace.findFirst({
        where: { members: { some: { userId } } },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          wa: true,
          ig: true,
        },
      });
    }

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    return res.json({ ok: true, workspace });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error', message: err?.message });
  }
});

workspaceRouter.post('/wa-account', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { phoneNumberId, businessAccountId, accessToken, webhookVerifyToken } = req.body;

  const wa = await prisma.waAccount.upsert({
    where: { workspaceId },
    update: {
      phoneNumberId,
      businessAccountId,
      ...(accessToken ? { accessToken } : {}),
      ...(webhookVerifyToken ? { webhookVerifyToken } : {}),
    },
    create: {
      workspaceId,
      phoneNumberId,
      businessAccountId,
      accessToken: accessToken || 'wa-placeholder-token',
      webhookVerifyToken: webhookVerifyToken || `wa-${Date.now()}`,
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
      ...(accessToken ? { accessToken } : {}),
      ...(webhookVerifyToken ? { webhookVerifyToken } : {}),
    },
    create: {
      workspaceId,
      igUserId,
      accessToken: accessToken || 'ig-placeholder-token',
      webhookVerifyToken: webhookVerifyToken || `ig-${Date.now()}`,
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

// Business Hours
workspaceRouter.get('/business-hours', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      businessHoursEnabled: true,
      businessHoursJson: true,
    },
  });

  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  let hours: Record<string, [string, string]> = {};
  try {
    hours = workspace.businessHoursJson
      ? JSON.parse(workspace.businessHoursJson)
      : {};
  } catch {
    hours = {};
  }

  return res.json({
    ok: true,
    businessHoursEnabled: workspace.businessHoursEnabled,
    businessHoursJson: hours,
  });
});

workspaceRouter.patch('/business-hours', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const parsed = BusinessHoursSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { enabled, hours } = parsed.data;

  const updateData: Record<string, unknown> = {
    businessHoursEnabled: enabled,
  };

  if (hours) {
    updateData.businessHoursJson = JSON.stringify(hours);
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: updateData,
    select: {
      businessHoursEnabled: true,
      businessHoursJson: true,
    },
  });

  let parsedHours: Record<string, [string, string]> = {};
  try {
    parsedHours = workspace.businessHoursJson
      ? JSON.parse(workspace.businessHoursJson)
      : {};
  } catch {
    parsedHours = {};
  }

  return res.json({
    ok: true,
    businessHoursEnabled: workspace.businessHoursEnabled,
    businessHoursJson: parsedHours,
  });
});

// Away Messages
const AwayMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  isActive: z.boolean().default(true),
  priority: z.number().min(0).default(0),
  showWhenNoAgent: z.boolean().default(false),
});

workspaceRouter.get('/away-messages', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const awayMessages = await prisma.awayMessage.findMany({
    where: { workspaceId },
    orderBy: { priority: 'desc' },
  });

  return res.json({ ok: true, awayMessages });
});

workspaceRouter.post('/away-messages', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  const parsed = AwayMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { message, isActive, priority, showWhenNoAgent } = parsed.data;

  const awayMessage = await prisma.awayMessage.create({
    data: {
      workspaceId,
      message,
      isActive,
      priority,
      showWhenNoAgent,
    },
  });

  return res.json({ ok: true, awayMessage });
});

workspaceRouter.patch('/away-messages/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;
  const { message, isActive, priority, showWhenNoAgent } = req.body;

  const awayMessage = await prisma.awayMessage.updateMany({
    where: { id, workspaceId },
    data: {
      ...(message !== undefined && { message }),
      ...(isActive !== undefined && { isActive }),
      ...(priority !== undefined && { priority }),
      ...(showWhenNoAgent !== undefined && { showWhenNoAgent }),
    },
  });

  if (awayMessage.count === 0) {
    return res.status(404).json({ error: 'Away message not found' });
  }

  return res.json({ ok: true, message: 'Away message updated' });
});

workspaceRouter.delete('/away-messages/:id', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  const result = await prisma.awayMessage.deleteMany({
    where: { id, workspaceId },
  });

  if (result.count === 0) {
    return res.status(404).json({ error: 'Away message not found' });
  }

  return res.json({ ok: true, message: 'Away message deleted' });
});

export default workspaceRouter;
