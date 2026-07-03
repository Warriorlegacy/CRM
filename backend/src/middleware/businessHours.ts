import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export interface BusinessHoursConfig {
  mon?: [string, string];
  tue?: [string, string];
  wed?: [string, string];
  thu?: [string, string];
  fri?: [string, string];
  sat?: [string, string];
  sun?: [string, string];
}

export interface AuthedRequest extends Request {
  userId: string;
  workspaceId: string;
}

const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function isDayKey(key: unknown): key is keyof BusinessHoursConfig {
  return typeof key === 'string' && DAY_ORDER.includes(key);
}

function timeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function isWithinBusinessHours(
  config: BusinessHoursConfig,
  now: Date
): boolean {
  const dayKey = DAY_ORDER[now.getDay()] as keyof BusinessHoursConfig;
  const range = config[dayKey];
  if (!range) return false;

  const [startStr, endStr] = range;
  const start = timeToMinutes(startStr);
  const end = timeToMinutes(endStr);
  if (start === null || end === null) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (end > start) {
    return currentMinutes >= start && currentMinutes < end;
  } else {
    return currentMinutes >= start || currentMinutes < end;
  }
}

async function isAnyAgentOnline(workspaceId: string): Promise<boolean> {
  const fiveSecondsAgo = new Date(Date.now() - 5000);
  const recentTyping = await prisma.typingIndicator.count({
    where: {
      workspaceId,
      status: 'typing',
      updatedAt: { gte: fiveSecondsAgo },
    },
  });
  if (recentTyping > 0) return true;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentActivity = await prisma.typingIndicator.count({
    where: {
      workspaceId,
      updatedAt: { gte: fiveMinutesAgo },
    },
  });
  if (recentActivity > 0) return true;

  const recentSent = await prisma.message.count({
    where: {
      workspaceId,
      direction: 'outbound',
      createdAt: { gte: fiveMinutesAgo },
    },
  });
  return recentSent > 0;
}

export async function businessHoursMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
      select: {
        businessHoursEnabled: true,
        businessHoursJson: true,
      },
    });

    if (!workspace || !workspace.businessHoursEnabled) {
      return next();
    }

    if (!workspace.businessHoursJson) {
      return next();
    }

    let config: BusinessHoursConfig;
    try {
      config = JSON.parse(workspace.businessHoursJson) as BusinessHoursConfig;
    } catch {
      return next();
    }

    const validConfig = Object.fromEntries(
      Object.entries(config).filter(
        ([key, val]) => isDayKey(key) && Array.isArray(val) && val.length === 2
      )
    ) as BusinessHoursConfig;

    if (Object.keys(validConfig).length === 0) {
      return next();
    }

    if (isWithinBusinessHours(validConfig, new Date())) {
      return next();
    }

    const anyAgentOnline = await isAnyAgentOnline(req.workspaceId);
    if (anyAgentOnline) {
      return next();
    }

    res.locals.sendAwayMessage = true;
    next();
  } catch (error) {
    console.error('Business hours middleware error:', error);
    next();
  }
}
