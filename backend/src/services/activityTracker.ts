import { prisma } from '../prisma';

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export async function trackActivity(
  workspaceId: string,
  userId: string,
  action: 'typing' | 'viewing' | 'replying',
  conversationId: string
): Promise<void> {
  await prisma.agentActivity.create({
    data: {
      workspaceId,
      userId,
      action,
      conversationId,
    },
  });
}

export async function getActiveAgents(
  workspaceId: string,
  conversationId: string
): Promise<
  {
    userId: string;
    userName: string;
    action: string;
    createdAt: string;
  }[]
> {
  const threshold = new Date(Date.now() - STALE_THRESHOLD_MS);

  const activities = await prisma.agentActivity.findMany({
    where: {
      workspaceId,
      conversationId,
      createdAt: { gte: threshold },
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const latestByUser = new Map<string, (typeof activities)[number]>();
  for (const a of activities) {
    if (!latestByUser.has(a.userId)) {
      latestByUser.set(a.userId, a);
    }
  }

  return Array.from(latestByUser.values()).map((a) => ({
    userId: a.userId,
    userName: a.user?.name || 'Unknown',
    action: a.action,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function cleanupStaleActivities(): Promise<number> {
  const threshold = new Date(Date.now() - STALE_THRESHOLD_MS);

  const result = await prisma.agentActivity.deleteMany({
    where: {
      createdAt: { lt: threshold },
    },
  });

  return result.count;
}
