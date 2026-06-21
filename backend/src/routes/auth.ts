import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma';
import { generateToken, requireAuth, AuthedRequest } from '../middleware/auth';
import { env } from '../env';
import { logger } from '../middleware/logger';

export const authRouter = Router();

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').optional(),
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return JWT token
 */
authRouter.post('/login', async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parsed.error.flatten(),
      });
    }

    const { email, password } = parsed.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account deactivated',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Get primary workspace
    const primaryWorkspace = user.workspaceMembers[0];
    if (!primaryWorkspace) {
      return res.status(500).json({
        error: 'Server Error',
        message: 'User has no associated workspaces',
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, primaryWorkspace.workspaceId);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: primaryWorkspace.role,
        },
        workspace: {
          id: primaryWorkspace.workspace.id,
          name: primaryWorkspace.workspace.name,
        },
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
    return res.status(500).json({
      error: 'Internal Server Error',
      message:
        env.NODE_ENV === 'production'
          ? 'Login failed'
          : error instanceof Error
            ? error.message
            : 'Login failed',
    });
  }
});

/**
 * POST /api/v1/auth/register
 * Register a new user with a workspace
 */
authRouter.post('/register', async (req, res) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parsed.error.flatten(),
      });
    }

    const { email, password, name, workspaceName } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    // Create user and workspace in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          active: true,
        },
      });

      // Create workspace
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName || `${name}'s Workspace`,
          slug: `workspace-${Date.now()}`,
          ownerId: user.id,
        },
      });

      // Create workspace membership
      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'admin',
        },
      });

      return { user, workspace };
    });

    // Generate JWT token
    const token = generateToken(result.user.id, result.workspace.id);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: 'admin',
        },
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
        },
      },
    });
  } catch (error) {
    logger.error('Registration error', { error });
    return res.status(500).json({
      error: 'Internal Server Error',
      message:
        env.NODE_ENV === 'production'
          ? 'Registration failed'
          : error instanceof Error
            ? error.message
            : 'Registration failed',
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh JWT token
 */
authRouter.post('/refresh', requireAuth, async (req, res) => {
  try {
    const authedReq = req as AuthedRequest;
    
    // Generate new token
    const token = generateToken(authedReq.userId, authedReq.workspaceId);

    return res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    logger.error('Token refresh error', { error });
    return res.status(500).json({
      error: 'Internal Server Error',
      message:
        env.NODE_ENV === 'production'
          ? 'Token refresh failed'
          : error instanceof Error
            ? error.message
            : 'Token refresh failed',
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const authedReq = req as AuthedRequest;
    
    const user = await prisma.user.findUnique({
      where: { id: authedReq.userId },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    const currentWorkspace = user.workspaceMembers.find(
      (w: { workspaceId: string }) => w.workspaceId === authedReq.workspaceId
    );

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: currentWorkspace?.role,
        },
        workspaces: user.workspaceMembers.map((w: { workspace: { id: string; name: string }; role: string }) => ({
          id: w.workspace.id,
          name: w.workspace.name,
          role: w.role,
        })),
      },
    });
  } catch (error) {
    logger.error('Get user error', { error });
    return res.status(500).json({
      error: 'Internal Server Error',
      message:
        env.NODE_ENV === 'production'
          ? 'Failed to get user info'
          : error instanceof Error
            ? error.message
            : 'Failed to get user info',
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout (client should discard token)
 */
authRouter.post('/logout', async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // Here we can add token blacklisting if needed
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default authRouter;
