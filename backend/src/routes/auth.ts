import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../prisma';
import { generateToken, requireAuth, AuthedRequest } from '../middleware/auth';
import { env } from '../env';
import { logger } from '../middleware/logger';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

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
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Auto-verify email on valid password login if not already verified
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }).catch(() => {});
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
 * POST /api/v1/auth/google
 * Authenticate or Register user via Google OAuth / One-Tap
 * Verifies the Google ID token (credential) on the backend.
 */
authRouter.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Google credential token is required',
      });
    }

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Google credential',
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Google account has no email',
      });
    }

    const cleanEmail = payload.email.toLowerCase().trim();
    const userName = payload.name || cleanEmail.split('@')[0];
    const picture = payload.picture || '';

    // Find existing user by email
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        workspaceMembers: {
          include: { workspace: true },
        },
      },
    });

    if (!user) {
      // User doesn't exist — create new user and default workspace
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = bcrypt.hashSync(randomPassword, env.BCRYPT_ROUNDS);

      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: cleanEmail,
            password: hashedPassword,
            name: userName,
            active: true,
            emailVerified: true,
          },
        });

        const workspace = await tx.workspace.create({
          data: {
            name: `${userName}'s Workspace`,
            slug: `workspace-${Date.now()}`,
            ownerId: newUser.id,
          },
        });

        await tx.workspaceMember.create({
          data: {
            userId: newUser.id,
            workspaceId: workspace.id,
            role: 'admin',
          },
        });

        return { user: newUser, workspace };
      });

      user = await prisma.user.findUnique({
        where: { id: result.user.id },
        include: {
          workspaceMembers: {
            include: { workspace: true },
          },
        },
      });
    }

    if (!user || !user.active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account is deactivated',
      });
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    const primaryWorkspace = user.workspaceMembers[0];
    if (!primaryWorkspace) {
      return res.status(500).json({
        error: 'Server Error',
        message: 'User has no associated workspace',
      });
    }

    const token = generateToken(user.id, primaryWorkspace.workspaceId);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return res.json({
      success: true,
      message: 'Google login successful',
      token,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture,
        },
        workspace: {
          id: primaryWorkspace.workspace.id,
          name: primaryWorkspace.workspace.name,
          role: primaryWorkspace.role,
        },
      },
    });
  } catch (error) {
    logger.error('Google Auth Error', { error });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Google authentication failed',
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
    const hashedPassword = bcrypt.hashSync(password, env.BCRYPT_ROUNDS);
    
    // Create user and workspace in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          active: true,
          emailVerified: false,
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
 
      // Create VerificationToken
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await tx.verificationToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });
 
      return { user, workspace, verificationToken: token };
    });
 
    // Send verification email — if SMTP not configured, auto-verify
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify?token=${result.verificationToken}`;
    const emailSent = await sendVerificationEmail(email, result.verificationToken);

    let autoVerified = false;
    if (emailSent) {
      logger.info('Verification email sent', { email });
    } else {
      // No SMTP configured — auto-verify the user so they aren't stuck
      logger.warn('SMTP not available — auto-verifying user', { email });
      await prisma.user.update({
        where: { id: result.user.id },
        data: { emailVerified: true },
      });
      await prisma.verificationToken.deleteMany({ where: { userId: result.user.id } });
      autoVerified = true;
    }

    return res.status(201).json({
      success: true,
      message: autoVerified
        ? 'Registration successful. You can now log in.'
        : 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        verificationUrl: autoVerified ? undefined : verifyUrl,
        autoVerified,
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

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/v1/auth/forgot-password
 * Generate a password reset token and "send" link
 */
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });
    }

    const { email } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      
      if (user) {
        // Delete existing reset/verification tokens
        await prisma.verificationToken.deleteMany({ where: { userId: user.id } }).catch(() => {});

        // Create a new token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        await prisma.verificationToken.create({
          data: {
            token,
            userId: user.id,
            expiresAt,
          },
        });

        const frontendUrl = process.env.FRONTEND_URL || 'https://signhify-crm.vercel.app';
        const emailSent = await sendPasswordResetEmail(cleanEmail, token).catch(() => false);
        if (!emailSent) {
          logger.warn('Failed to send password reset email', { email: cleanEmail });
          console.log(`[DEV] Password Reset URL: ${frontendUrl}/reset-password?token=${token}`);
        }
      }
    } catch (dbErr: any) {
      logger.error('Database query error during forgot password', { error: dbErr?.message || dbErr });
    }

    return res.json({ success: true, message: 'If the email matches an account, a password reset link has been sent.' });
  } catch (error: any) {
    logger.error('Forgot password error', { error: error?.message || error });
    return res.json({ success: true, message: 'If the email matches an account, a password reset link has been sent.' });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Reset password using the token
 */
authRouter.post('/reset-password', async (req, res) => {
  try {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() });
    }

    const { token, password } = parsed.data;

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      if (verificationToken) {
        await prisma.verificationToken.delete({ where: { id: verificationToken.id } }).catch(() => {});
      }
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(password, env.BCRYPT_ROUNDS);

    // Update password, mark email as verified, and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          password: hashedPassword,
          emailVerified: true,
        },
      }),
      prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    return res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    logger.error('Reset password error', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default authRouter;
