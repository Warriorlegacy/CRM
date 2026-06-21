import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import { getWorkspaceLimits, checkLimit } from '../middleware/limits';

export const inviteRouter = Router();

const InviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name is required'),
  role: z.enum(['admin', 'agent']).default('agent'),
});

inviteRouter.post('/', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const inviterId = (req as any).userId;

  const parsed = InviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: parsed.error.flatten() 
    });
  }

  const { email, name, role } = parsed.data;

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: inviterId },
  });

  if (!member || member.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can invite users' });
  }

  // Check user limit
  const limits = await getWorkspaceLimits(workspaceId);
  const memberCount = await prisma.workspaceMember.count({ where: { workspaceId } });
  if (!checkLimit(memberCount, limits.maxUsers)) {
    return res.status(403).json({
      error: 'Limit Reached',
      message: `You've reached the users limit for your current plan. Please upgrade to continue.`,
      limit: { current: memberCount, max: limits.maxUsers, resource: 'users' },
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: existingUser.id },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: existingUser.id,
        role,
      },
    });

    return res.json({ 
      ok: true, 
      message: 'User added to workspace',
      user: { id: existingUser.id, email: existingUser.email, name: existingUser.name },
    });
  }

  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
    },
  });

  await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: newUser.id,
      role,
    },
  });

  return res.json({ 
    ok: true, 
    message: 'User invited successfully. They can login with their email and temporary password.',
    user: { id: newUser.id, email: newUser.email, name: newUser.name },
    tempPassword,
  });
});

inviteRouter.patch('/:userId', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const adminId = (req as any).userId;
  const { userId } = req.params;
  const { role } = req.body;

  const adminMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: adminId },
  });

  if (!adminMember || adminMember.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can change roles' });
  }

  if (userId === adminId) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });

  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: member.id },
    data: { role },
  });

  return res.json({ ok: true, member: updated });
});

inviteRouter.delete('/:userId', async (req, res) => {
  const workspaceId = (req as any).workspaceId;
  const adminId = (req as any).userId;
  const { userId } = req.params;

  const adminMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: adminId },
  });

  if (!adminMember || adminMember.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can remove members' });
  }

  if (userId === adminId) {
    return res.status(400).json({ error: 'Cannot remove yourself' });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });

  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  await prisma.workspaceMember.delete({
    where: { id: member.id },
  });

  return res.json({ ok: true, message: 'Member removed from workspace' });
});

export default inviteRouter;
