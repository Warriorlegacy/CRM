import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';
import { prisma } from '../prisma';

export interface AuthedRequest extends Request {
  userId: string;
  workspaceId: string;
  token?: string;
}

interface JWTPayload {
  userId: string;
  workspaceId: string;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string, workspaceId: string): string {
  return jwt.sign(
    { userId, workspaceId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}

/**
 * Extract token from request headers
 */
function extractToken(req: Request): string | null {
  // Check Authorization header (Bearer token) - XHR/fetch requests
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fallback to x-access-token header
  const accessToken = req.header('x-access-token');
  if (accessToken) {
    return accessToken;
  }

  // Check httpOnly cookie (set during OAuth pre-redirect flow)
  const cookieToken = (req as any).cookies?.oauth_context;
  if (cookieToken) {
    return cookieToken;
  }

  // Check query parameter (for webhooks and legacy OAuth redirects)
  // NOTE: OAuth redirects have a known limitation where the token
  // may appear in the query string during the full-page redirect.
  // The cookie-based pre-redirect flow (POST /api/v1/oauth/establish)
  // resolves this by using an httpOnly cookie instead.
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please provide a valid token.',
      });
      return;
    }

    let payload: JWTPayload;
    
    try {
      payload = verifyToken(token);
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token expired. Please log in again.',
        });
        return;
      }
      
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token.',
        });
        return;
      }
      
      throw jwtError;
    }

    // Validate that user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, active: true },
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found.',
      });
      return;
    }

    if (!user.active) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Account deactivated.',
      });
      return;
    }

    // Validate workspace membership with fallback
    let activeWorkspaceId = payload.workspaceId;
    let workspaceMember = activeWorkspaceId
      ? await prisma.workspaceMember.findFirst({
          where: {
            userId: payload.userId,
            workspaceId: activeWorkspaceId,
          },
        })
      : null;

    if (!workspaceMember) {
      const fallbackMember = await prisma.workspaceMember.findFirst({
        where: { userId: payload.userId },
      });
      if (fallbackMember) {
        workspaceMember = fallbackMember;
        activeWorkspaceId = fallbackMember.workspaceId;
      } else {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this workspace.',
        });
        return;
      }
    }

    // Attach user info to request
    (req as AuthedRequest).userId = payload.userId;
    (req as AuthedRequest).workspaceId = activeWorkspaceId;
    (req as AuthedRequest).token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check failed.',
    });
  }
}

/**
 * Optional auth middleware - attaches user info if token present, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const payload = verifyToken(token);
        (req as AuthedRequest).userId = payload.userId;
        (req as AuthedRequest).workspaceId = payload.workspaceId;
        (req as AuthedRequest).token = token;
      } catch {
        // Invalid token, but we don't reject the request
      }
    }

    next();
  } catch (error) {
    next();
  }
}

/**
 * Middleware to require specific role
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authedReq = req as AuthedRequest;
      
      if (!authedReq.userId || !authedReq.workspaceId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required.',
        });
        return;
      }

      const member = await prisma.workspaceMember.findFirst({
        where: {
          userId: authedReq.userId,
          workspaceId: authedReq.workspaceId,
          role: { in: allowedRoles },
        },
      });

      if (!member) {
        res.status(403).json({
          error: 'Forbidden',
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Role verification failed.',
      });
    }
  };
}

/**
 * Legacy middleware for backward compatibility (header-based auth)
 * @deprecated Use requireAuth instead
 */
export function requireAuthLegacy(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.header('x-user-id');
  const workspaceId = req.header('x-workspace-id');

  if (!userId || !workspaceId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-user-id or x-workspace-id headers',
    });
    return;
  }

  (req as AuthedRequest).userId = userId;
  (req as AuthedRequest).workspaceId = workspaceId;

  next();
}
