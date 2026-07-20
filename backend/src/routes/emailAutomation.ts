import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { EMAIL_TEMPLATES, renderTemplate, sendEmail } from '../services/emailAutomation';
import { sendTeamNotification } from '../services/emailAutomation';
import { AuthedRequest } from '../middleware/auth';

export const emailAutomationRouter = Router();

const SmtpConfigSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.number().int().positive().default(587),
  secure: z.boolean().default(false),
  user: z.string().min(1, 'SMTP username is required'),
  pass: z.string().min(1, 'SMTP password is required'),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
});

const AutomationRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  trigger: z.enum([
    'new_lead',
    'followup_due',
    'stage_changed',
    'deal_won',
    'deal_lost',
    'weekly_report',
    'meeting_request',
    'no_reply_24h',
    'custom',
  ]),
  condition: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  bodyHtml: z.string().min(1, 'Email body is required'),
  senderName: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ─── SMTP Configuration ───────────────────────────────────────────

emailAutomationRouter.get('/smtp', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const config = await prisma.smtpConfig.findUnique({
    where: { workspaceId },
    select: {
      id: true,
      host: true,
      port: true,
      secure: true,
      user: true,
      fromName: true,
      fromEmail: true,
      isVerified: true,
    },
  });

  return res.json({ ok: true, config: config || null });
});

emailAutomationRouter.post('/smtp', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const parsed = SmtpConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { host, port, secure, user, pass, fromName, fromEmail } = parsed.data;

  const config = await prisma.smtpConfig.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      host,
      port,
      secure,
      user,
      pass,
      fromName: fromName || null,
      fromEmail: fromEmail || null,
    },
    update: {
      host,
      port,
      secure,
      user,
      pass,
      fromName: fromName || null,
      fromEmail: fromEmail || null,
    },
  });

  return res.json({ ok: true, message: 'SMTP configuration saved', config: { ...config, pass: undefined } });
});

emailAutomationRouter.post('/smtp/test', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Test email address is required' });
  }

  const sent = await sendEmail(
    workspaceId,
    email,
    '✅ SMTP Configuration Successful — Signhify CRM',
    `<h1>SMTP Test</h1><p>Your SMTP configuration is working perfectly! You can now send email campaigns and automated emails from Signhify CRM.</p><p>Sent at: ${new Date().toLocaleString()}</p>`
  );

  if (!sent) {
    return res.status(500).json({ error: 'Failed to send test email. Please verify your SMTP settings.' });
  }

  // Mark as verified
  await prisma.smtpConfig.update({
    where: { workspaceId },
    data: { isVerified: true },
  }).catch(() => {});

  return res.json({ ok: true, message: 'Test email sent successfully!' });
});

// ─── Automation Rules ─────────────────────────────────────────────

emailAutomationRouter.get('/rules', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const rules = await prisma.emailAutomationRule.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ ok: true, rules });
});

emailAutomationRouter.post('/rules', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;

  const parsed = AutomationRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parsed.error.flatten(),
    });
  }

  const { name, trigger, condition, subject, bodyHtml, senderName, isActive } = parsed.data;

  const rule = await prisma.emailAutomationRule.create({
    data: {
      workspaceId,
      name,
      trigger,
      condition: condition || null,
      subject,
      bodyHtml,
      senderName: senderName || null,
      isActive,
    },
  });

  return res.status(201).json({ ok: true, rule });
});

emailAutomationRouter.patch('/rules/:id', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;
  const { name, trigger, condition, subject, bodyHtml, senderName, isActive } = req.body;

  const rule = await prisma.emailAutomationRule.findFirst({
    where: { id, workspaceId },
  });

  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  const updated = await prisma.emailAutomationRule.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(trigger !== undefined && { trigger }),
      ...(condition !== undefined && { condition }),
      ...(subject !== undefined && { subject }),
      ...(bodyHtml !== undefined && { bodyHtml }),
      ...(senderName !== undefined && { senderName }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return res.json({ ok: true, rule: updated });
});

emailAutomationRouter.delete('/rules/:id', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { id } = req.params;

  const rule = await prisma.emailAutomationRule.findFirst({
    where: { id, workspaceId },
  });

  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  await prisma.emailAutomationRule.delete({ where: { id } });

  return res.status(204).send();
});

// ─── Triggers ─────────────────────────────────────────────────────

emailAutomationRouter.post('/trigger/:trigger', async (req: Request, res: Response) => {
  const { workspaceId } = req as unknown as AuthedRequest;
  const { trigger } = req.params;
  const { contactId, email, variables } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const rules = await prisma.emailAutomationRule.findMany({
    where: { workspaceId, trigger, isActive: true },
  });

  if (rules.length === 0) {
    return res.json({ ok: true, triggered: 0, message: 'No active rules for this trigger' });
  }

  let triggered = 0;
  for (const rule of rules) {
    const html = renderTemplate(rule.bodyHtml, { ...variables, email });
    const subject = renderTemplate(rule.subject, { ...variables, email });
    const sent = await sendEmail(workspaceId, email, subject, html);
    if (sent) triggered++;
  }

  return res.json({ ok: true, triggered, total: rules.length });
});
