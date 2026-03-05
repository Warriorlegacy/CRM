import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const analyticsRouter = Router();

const extractAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.header('x-user-id');
  const workspaceId = req.header('x-workspace-id');

  if (!userId || !workspaceId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-user-id or x-workspace-id headers',
    });
  }

  (req as any).userId = userId;
  (req as any).workspaceId = workspaceId;
  next();
};

analyticsRouter.use(extractAuth);

analyticsRouter.get('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const { period = '7d' } = req.query;

  let startDate = new Date();
  switch (period) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  try {
    const [
      totalContacts,
      newContacts,
      totalMessages,
      messagesByDay,
      stageDistribution,
      teamPerformance,
      recentConversations,
      pendingFollowups,
    ] = await Promise.all([
      prisma.contact.count({ where: { workspaceId } }),
      prisma.contact.count({
        where: {
          workspaceId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.message.count({
        where: {
          workspaceId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM Message
        WHERE workspaceId = ${workspaceId}
        AND createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY date
      `,
      prisma.contact.groupBy({
        by: ['stage'],
        where: { workspaceId },
        _count: { id: true },
      }),
      prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            include: {
              assignedContacts: {
                where: { workspaceId },
              },
              sentMessages: {
                where: { workspaceId, createdAt: { gte: startDate } },
              },
            },
          },
        },
      }),
      prisma.conversation.findMany({
        where: { workspaceId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          contact: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.followup.count({
        where: {
          workspaceId,
          status: 'pending',
          dueAt: { lte: new Date() },
        },
      }),
    ]);

    const dailyMessages = Array.isArray(messagesByDay) 
      ? messagesByDay.map((row: any) => ({
          date: row.date,
          count: Number(row.count),
        }))
      : [];

    const stageStats = stageDistribution.map((s) => ({
      stage: s.stage,
      count: s._count.id,
    }));

    const teamStats = teamPerformance.map((m) => ({
      id: m.user.id,
      name: m.user.name || m.user.email,
      email: m.user.email,
      contactsAssigned: m.user.assignedContacts.length,
      messagesSent: m.user.sentMessages.length,
    }));

    res.json({
      analytics: {
        overview: {
          totalContacts,
          newContacts,
          totalMessages,
          pendingFollowups,
        },
        dailyMessages,
        stageDistribution: stageStats,
        teamPerformance: teamStats,
        recentActivity: recentConversations.map((c) => ({
          id: c.id,
          contactName: c.contact.name,
          contactPhone: c.contact.phone,
          lastMessage: c.messages[0]?.bodyText || 'No messages',
          lastMessageAt: c.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

analyticsRouter.get('/metrics', async (req, res) => {
  const workspaceId = (req as any).workspaceId;

  try {
    const [
      totalContacts,
      activeConversations,
      messagesToday,
      conversionRate,
    ] = await Promise.all([
      prisma.contact.count({ where: { workspaceId } }),
      prisma.conversation.count({
        where: { workspaceId, status: 'open' },
      }),
      prisma.message.count({
        where: {
          workspaceId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.contact.count({
        where: { workspaceId, stage: 'won' },
      }).then(async (won) => {
        const total = await prisma.contact.count({ where: { workspaceId } });
        return total > 0 ? ((won / total) * 100).toFixed(1) : '0';
      }),
    ]);

    res.json({
      metrics: {
        totalContacts,
        activeConversations,
        messagesToday,
        conversionRate: Number(conversionRate),
      },
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});
