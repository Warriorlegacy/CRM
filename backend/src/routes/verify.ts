import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { sendVerificationEmail } from '../services/email';

export const verifyRouter = Router();

// Request email verification
verifyRouter.post('/request', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal if user exists
    return res.json({ ok: true, message: 'If an account exists, a verification email has been sent.' });
  }

  // Delete old tokens
  await prisma.verificationToken.deleteMany({
    where: { userId: user.id },
  });

  // Create new token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // Send verification email
  const emailSent = await sendVerificationEmail(email, token);
  if (!emailSent) {
    console.log(`[DEV] Verification token for ${email}: ${token}`);
    console.log(`[DEV] Verification URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`);
  }

  return res.json({ ok: true, message: 'If an account exists, a verification email has been sent.' });
});

// Verify email with token
verifyRouter.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    return res.status(400).json({ error: 'Invalid or expired verification token' });
  }

  if (verificationToken.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } }).catch(() => {});
    return res.status(400).json({ error: 'Verification token has expired' });
  }

  // Set emailVerified to true on the User and delete the token in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    }),
    prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    }),
  ]);

  return res.json({ ok: true, message: 'Email verified successfully' });
});

export default verifyRouter;
