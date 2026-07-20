import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendCampaign, EMAIL_TEMPLATES, renderTemplate } from '../services/emailAutomation';
import { sendEmail } from '../services/emailAutomation';
import { AuthedRequest } from '../middleware/auth';

export const emailCampaignsRouter = Router();

const CreateCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  bodyHtml: z.string().min(1, 'Email body is required'),
  bodyText: z.string().optional(),
  senderName: z.string().optional(),
  senderEmail: z.string().optional(),
  replyTo: z.string().email().optional(),
  recipientFilter: z.string().optional(),
  scheduledAt: z.string().optional(),
});

const SendTestSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
});

// GET /api/v1/email-campaigns - List all campaigns
emailCampaignsRouter.get('/', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { status, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { workspaceId };
  if (status && status !== 'all') where.status = status;

  const [campaigns, total] = await Promise.all([
    prisma.emailCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.emailCampaign.count({ where }),
  ]);

  return res.json({
    ok: true,
    campaigns,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// POST /api/v1/email-campaigns - Create a campaign
emailCampaignsRouter.post('/', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const parsed = CreateCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { name, subject, bodyHtml, bodyText, senderName, senderEmail, replyTo, recipientFilter, scheduledAt } = parsed.data;

  const campaign = await prisma.emailCampaign.create({
    data: {
      workspaceId,
      name,
      subject,
      bodyHtml,
      bodyText: bodyText || null,
      senderName: senderName || null,
      senderEmail: senderEmail || null,
      replyTo: replyTo || null,
      recipientFilter: recipientFilter || null,
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return res.status(201).json({ ok: true, campaign });
});

// GET /api/v1/email-campaigns/templates - Get email templates
emailCampaignsRouter.get('/templates', async (_req: Request, res: Response) => {
  const templates = Object.entries(EMAIL_TEMPLATES).map(([key, tmpl]) => ({
    id: key,
    name: tmpl.name,
    subject: tmpl.subject,
    body: tmpl.body,
  }));

  return res.json({ ok: true, templates });
});

// GET /api/v1/email-campaigns/:id - Get campaign details
emailCampaignsRouter.get('/:id', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const campaign = await prisma.emailCampaign.findFirst({
    where: { id, workspaceId },
    include: {
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
    },
  });

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  return res.json({ ok: true, campaign });
});

// POST /api/v1/email-campaigns/:id/send - Send campaign
emailCampaignsRouter.post('/:id/send', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const campaign = await prisma.emailCampaign.findFirst({
    where: { id, workspaceId },
  });

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status === 'sent' || campaign.status === 'sending') {
    return res.status(400).json({ error: 'Campaign already sent or in progress' });
  }

  // Start sending in background
  sendCampaign(id).catch((err) => {
    console.error('Campaign send error:', err);
  });

  return res.json({ ok: true, message: 'Campaign sending started' });
});

// POST /api/v1/email-campaigns/send-test - Send test email
emailCampaignsRouter.post('/send-test', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const parsed = SendTestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { email, subject, bodyHtml } = parsed.data;

  const sent = await sendEmail(workspaceId, email, subject, bodyHtml);

  if (!sent) {
    return res.status(500).json({ error: 'Failed to send test email. Check SMTP configuration.' });
  }

  return res.json({ ok: true, message: 'Test email sent!' });
});

// PATCH /api/v1/email-campaigns/:id - Update campaign
emailCampaignsRouter.patch('/:id', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const campaign = await prisma.emailCampaign.findFirst({
    where: { id, workspaceId },
  });

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status === 'sent' || campaign.status === 'sending') {
    return res.status(400).json({ error: 'Cannot edit a sent or in-progress campaign' });
  }

  const { name, subject, bodyHtml, bodyText, senderName, senderEmail, replyTo, recipientFilter, scheduledAt } = req.body;

  const updated = await prisma.emailCampaign.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(subject !== undefined && { subject }),
      ...(bodyHtml !== undefined && { bodyHtml }),
      ...(bodyText !== undefined && { bodyText }),
      ...(senderName !== undefined && { senderName }),
      ...(senderEmail !== undefined && { senderEmail }),
      ...(replyTo !== undefined && { replyTo }),
      ...(recipientFilter !== undefined && { recipientFilter }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
    },
  });

  return res.json({ ok: true, campaign: updated });
});

// DELETE /api/v1/email-campaigns/:id - Delete campaign
emailCampaignsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const campaign = await prisma.emailCampaign.findFirst({
    where: { id, workspaceId },
  });

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  if (campaign.status === 'sending') {
    return res.status(400).json({ error: 'Cannot delete a campaign that is sending' });
  }

  await prisma.emailLog.deleteMany({ where: { campaignId: id } });
  await prisma.emailCampaign.delete({ where: { id } });

  return res.status(204).send();
});
