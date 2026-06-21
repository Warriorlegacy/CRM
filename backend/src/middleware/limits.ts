import { Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from './auth';

export interface WorkspaceLimits {
  maxContacts: number;
  maxMessagesPerMonth: number;
  maxUsers: number;
  maxChatbotFlows: number;
  plan: string;
}

export const PLAN_LIMITS: Record<string, WorkspaceLimits> = {
  free: {
    maxContacts: 100,
    maxMessagesPerMonth: 500,
    maxUsers: 1,
    maxChatbotFlows: 1,
    plan: 'free',
  },
  growth: {
    maxContacts: 2000,
    maxMessagesPerMonth: -1, // unlimited
    maxUsers: 5,
    maxChatbotFlows: 10,
    plan: 'growth',
  },
  business: {
    maxContacts: -1, // unlimited
    maxMessagesPerMonth: -1, // unlimited
    maxUsers: -1, // unlimited
    maxChatbotFlows: -1, // unlimited
    plan: 'business',
  },
};

export async function getWorkspaceLimits(workspaceId: string): Promise<WorkspaceLimits> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true },
  });
  
  const plan = workspace?.plan || 'free';
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function checkLimit(current: number, max: number): boolean {
  return max === -1 || current < max;
}

export function requireWithinLimits(check: (workspaceId: string) => Promise<{ current: number; max: number; resource: string }>) {
  return async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { current, max, resource } = await check(req.workspaceId);
      
      if (!checkLimit(current, max)) {
        res.status(403).json({
          error: 'Limit Reached',
          message: `You've reached the ${resource} limit for your current plan. Please upgrade to continue.`,
          limit: { current, max, resource },
        });
        return;
      }
      
      next();
    } catch (error) {
      next();
    }
  };
}
