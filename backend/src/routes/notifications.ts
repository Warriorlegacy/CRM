import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { publish } from '../realtime/events';

export const notificationsRouter = Router();

// ─── Helper: Create + broadcast a notification ───────────────────
export async function createNotification(
  workspaceId: string,
  data: {
    type: 'inbound_message' | 'outbound_message' | 'followup_due' | 'team_invite' | 'flow_execution' | 'campaign_sent' | 'system';
    title: string;
    message: string;
    channel?: string;
    link?: string;
  }
) {
  const notification = await prisma.notification.create({
    data: {
      workspaceId,
      type: data.type,
      title: data.title,
      message: data.message,
      channel: data.channel || null,
      link: data.link || null,
    },
  });

  // Broadcast via WebSocket
  publish(workspaceId, {
    type: 'notification:new',
    data: notification,
  });

  return notification;
}

// ─── GET / ───────────────────────────────────────────────────────
// List notifications for workspace (paginated, sorted by newest)
notificationsRouter.get('/', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;
  const { limit = '50', offset = '0', filter, type } = req.query;

  try {
    if (!workspaceId) {
      return res.json({ notifications: [], total: 0, unreadCount: 0, hasMore: false });
    }
    const where: any = { workspaceId };

    if (filter === 'unread') where.read = false;
    else if (filter === 'read') where.read = true;

    if (type && type !== 'all') where.type = type as string;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit as string), 100),
        skip: parseInt(offset as string),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { workspaceId, read: false } }),
    ]);

    return res.json({
      notifications,
      total,
      unreadCount,
      hasMore: parseInt(offset as string) + notifications.length < total,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ─── PATCH /:id/read ─────────────────────────────────────────────
// Mark a single notification as read
notificationsRouter.patch('/:id/read', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findFirst({
      where: { id, workspaceId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    // Broadcast read status
    publish(workspaceId, {
      type: 'notification:read',
      data: { id },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ─── PATCH /read-all ─────────────────────────────────────────────
// Mark all notifications as read for the workspace
notificationsRouter.patch('/read-all', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;

  try {
    const result = await prisma.notification.updateMany({
      where: { workspaceId, read: false },
      data: { read: true },
    });

    publish(workspaceId, {
      type: 'notification:read-all',
      data: { count: result.count },
    });

    return res.json({ ok: true, count: result.count });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// ─── DELETE /:id ─────────────────────────────────────────────────
// Delete a single notification
notificationsRouter.delete('/:id', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findFirst({
      where: { id, workspaceId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({ where: { id } });

    publish(workspaceId, {
      type: 'notification:deleted',
      data: { id },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ─── DELETE / ────────────────────────────────────────────────────
// Clear all notifications for workspace
notificationsRouter.delete('/', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;

  try {
    const result = await prisma.notification.deleteMany({
      where: { workspaceId },
    });

    publish(workspaceId, {
      type: 'notification:cleared',
      data: { count: result.count },
    });

    return res.json({ ok: true, count: result.count });
  } catch (error) {
    console.error('Failed to clear notifications:', error);
    return res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

export default notificationsRouter;
