import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

export const analyticsRouter = Router();

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
      messagesByDayAndChannel,
      stageDistribution,
      teamPerformance,
      recentConversations,
      pendingFollowups,
      channelBreakdown,
      leadMetrics,
      chatbotMetrics,
    ] = await Promise.all([
      prisma.contact.count({ where: { workspaceId } }),
      prisma.contact.count({
        where: { workspaceId, createdAt: { gte: startDate } },
      }),
      prisma.message.count({
        where: { workspaceId, createdAt: { gte: startDate } },
      }),
      prisma.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM Message
        WHERE workspaceId = ${workspaceId}
        AND createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY date
      `,
      prisma.$queryRaw`
        SELECT DATE(createdAt) as date, channel, COUNT(*) as count
        FROM Message
        WHERE workspaceId = ${workspaceId}
        AND createdAt >= ${startDate}
        GROUP BY DATE(createdAt), channel
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
              assignedContacts: { where: { workspaceId } },
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
      // Channel breakdown
      Promise.all([
        prisma.contact.count({ where: { workspaceId, channel: 'whatsapp' } }),
        prisma.contact.count({ where: { workspaceId, channel: 'instagram' } }),
        prisma.message.count({ where: { workspaceId, channel: 'whatsapp', createdAt: { gte: startDate } } }),
        prisma.message.count({ where: { workspaceId, channel: 'instagram', createdAt: { gte: startDate } } }),
        prisma.conversation.count({ where: { workspaceId, channel: 'whatsapp' } }),
        prisma.conversation.count({ where: { workspaceId, channel: 'instagram' } }),
      ]),
      // Lead metrics
      Promise.all([
        prisma.contact.count({ where: { workspaceId, leadScore: { gte: 51 } } }),
        prisma.contact.count({ where: { workspaceId, leadScore: { gte: 26, lt: 51 } } }),
        prisma.contact.count({ where: { workspaceId, leadScore: { gte: 11, lt: 26 } } }),
        prisma.contact.count({ where: { workspaceId, leadScore: { lt: 11 } } }),
        prisma.contact.aggregate({ where: { workspaceId }, _avg: { leadScore: true } }),
        prisma.contact.count({ where: { workspaceId, stage: 'won' } }),
      ]),
      // Chatbot metrics
      Promise.all([
        prisma.chatbotFlow.count({ where: { workspaceId } }),
        prisma.chatbotFlow.count({ where: { workspaceId, isActive: true } }),
        prisma.flowExecution.count({ where: { flowId: { not: '' }, status: 'completed' } }),
        prisma.flowExecution.count({ where: { flowId: { not: '' }, status: 'abandoned' } }),
      ]),
    ]);

    const dailyMessages = Array.isArray(messagesByDay)
      ? messagesByDay.map((row: any) => ({
          date: row.date,
          count: Number(row.count),
        }))
      : [];

    // Build daily messages by channel
    const dailyByChannel: Record<string, { whatsapp: number; instagram: number }> = {};
    if (Array.isArray(messagesByDayAndChannel)) {
      for (const row of messagesByDayAndChannel as any[]) {
        const date = String(row.date);
        if (!dailyByChannel[date]) dailyByChannel[date] = { whatsapp: 0, instagram: 0 };
        if (row.channel === 'instagram') {
          dailyByChannel[date].instagram = Number(row.count);
        } else {
          dailyByChannel[date].whatsapp = Number(row.count);
        }
      }
    }
    const dailyMessagesByChannel = Object.entries(dailyByChannel).map(([date, counts]) => ({
      date,
      ...counts,
    }));

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

    const [waContacts, igContacts, waMessages, igMessages, waConversations, igConversations] = channelBreakdown;
    const [hotLeads, warmLeads, coldLeads, frozenLeads, avgScoreResult, convertedLeads] = leadMetrics;
    const [totalFlows, activeFlows, flowCompletions, flowAbandonments] = chatbotMetrics;

    const totalLeadsCount = hotLeads + warmLeads + coldLeads + frozenLeads;
    const conversionRate = totalContacts > 0 ? ((convertedLeads / totalContacts) * 100).toFixed(1) : '0';

    res.json({
      analytics: {
        overview: {
          totalContacts,
          newContacts,
          totalMessages,
          pendingFollowups,
        },
        channelBreakdown: {
          whatsapp: { contacts: waContacts, messages: waMessages, conversations: waConversations },
          instagram: { contacts: igContacts, messages: igMessages, conversations: igConversations },
        },
        dailyMessages,
        dailyMessagesByChannel,
        stageDistribution: stageStats,
        teamPerformance: teamStats,
        leadMetrics: {
          totalLeads: totalLeadsCount,
          hotLeads,
          warmLeads,
          coldLeads,
          frozenLeads,
          averageScore: Number(avgScoreResult._avg.leadScore || 0),
          convertedLeads,
          conversionRate: Number(conversionRate),
        },
        chatbotMetrics: {
          totalFlows,
          activeFlows,
          completions: flowCompletions,
          abandonments: flowAbandonments,
          abandonmentRate:
            flowCompletions + flowAbandonments > 0
              ? ((flowAbandonments / (flowCompletions + flowAbandonments)) * 100).toFixed(1)
              : '0',
        },
        recentActivity: recentConversations.map((c) => ({
          id: c.id,
          contactName: c.contact.name,
          contactPhone: c.contact.phone,
          channel: c.channel,
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
      whatsappContacts,
      instagramContacts,
    ] = await Promise.all([
      prisma.contact.count({ where: { workspaceId } }),
      prisma.conversation.count({
        where: { workspaceId, status: 'open' },
      }),
      prisma.message.count({
        where: {
          workspaceId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.contact.count({ where: { workspaceId, stage: 'won' } }).then(async (won) => {
        const total = await prisma.contact.count({ where: { workspaceId } });
        return total > 0 ? ((won / total) * 100).toFixed(1) : '0';
      }),
      prisma.contact.count({ where: { workspaceId, channel: 'whatsapp' } }),
      prisma.contact.count({ where: { workspaceId, channel: 'instagram' } }),
    ]);

    res.json({
      metrics: {
        totalContacts,
        activeConversations,
        messagesToday,
        conversionRate: Number(conversionRate),
        whatsappContacts,
        instagramContacts,
      },
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});
