import nodemailer from 'nodemailer';
import { prisma } from '../prisma';
import { logger } from '../middleware/logger';

// ─── Professional Email Templates ─────────────────────────────────

export const EMAIL_TEMPLATES = {
  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to {{company}} — Let\'s Get Started!',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f4f6f9}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#059669,#10b981);padding:40px 30px;text-align:center;border-radius:16px 16px 0 0}
.header h1{color:#fff;margin:0;font-size:28px;font-weight:700}
.header p{color:rgba(255,255,255,.85);margin-top:8px;font-size:16px}
.body-card{background:#fff;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,.06)}
.body-card h2{color:#1a1a2e;font-size:22px;margin:0 0 16px}
.body-card p{color:#4a5568;line-height:1.7;font-size:15px;margin:0 0 16px}
.cta-btn{display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:8px 0}
.features{display:grid;gap:12px;margin:24px 0}
.feature-item{background:#f8fafc;padding:16px;border-radius:8px;border-left:3px solid #10b981}
.feature-item h3{margin:0 0 4px;font-size:14px;color:#1a1a2e}
.feature-item p{margin:0;font-size:13px;color:#6b7280}
.footer{text-align:center;padding:20px;color:#9ca3af;font-size:12px}
</style></head><body>
<div class="container">
<div class="header"><h1>🚀 Welcome to {{company}}!</h1><p>Your journey to smarter sales starts now</p></div>
<div class="body-card">
<h2>Hey {{name}}!</h2>
<p>We're thrilled to have you on board. {{company}} is your new command center for turning WhatsApp conversations into closed deals.</p>
<div class="features">
<div class="feature-item"><h3>📨 Smart Inbox</h3><p>All your conversations in one place with team ownership</p></div>
<div class="feature-item"><h3>🤖 AI Auto-Responder</h3><p>Never miss a lead with 24/7 AI-powered replies</p></div>
<div class="feature-item"><h3>📊 Pipeline View</h3><p>Drag-and-drop your deals from first message to closed won</p></div>
</div>
<a href="{{dashboardUrl}}" class="cta-btn">Go to Dashboard →</a>
</div>
<div class="footer"><p>© {{year}} {{company}}. All rights reserved.</p></div>
</div></body></html>`,
  },
  followUp: {
    name: 'Follow-up Reminder',
    subject: '⏰ Follow-up Reminder: {{contactName}} is waiting',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f4f6f9}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#d97706,#f59e0b);padding:40px 30px;text-align:center;border-radius:16px 16px 0 0}
.header h1{color:#fff;margin:0;font-size:26px;font-weight:700}
.header p{color:rgba(255,255,255,.85);margin-top:8px}
.body-card{background:#fff;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,.06)}
.body-card h2{color:#1a1a2e;font-size:20px;margin:0 0 16px}
.body-card p{color:#4a5568;line-height:1.7;font-size:15px;margin:0 0 12px}
.contact-card{background:#fffbeb;padding:16px;border-radius:12px;border:1px solid #fde68a;margin:16px 0}
.contact-card strong{color:#92400e}
.cta-btn{display:inline-block;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:8px 0}
.footer{text-align:center;padding:20px;color:#9ca3af;font-size:12px}
</style></head><body>
<div class="container">
<div class="header"><h1>⏰ Follow-up Reminder</h1><p>Don't let a warm lead go cold</p></div>
<div class="body-card">
<h2>Hey {{name}} 👋</h2>
<div class="contact-card">
<strong>📞 {{contactName}}</strong><br>
<span style="color:#6b7280;font-size:13px">{{contactPhone}}</span>
</div>
<p>This contact needs your attention. A quick follow-up can make all the difference between closing and losing.</p>
<p style="font-style:italic;color:#6b7280">"{{note}}"</p>
<a href="{{dashboardUrl}}" class="cta-btn">Reply Now →</a>
</div>
<div class="footer"><p>© {{year}} {{company}}. All rights reserved.</p></div>
</div></body></html>`,
  },
  newsletter: {
    name: 'Newsletter / Campaign',
    subject: '{{subject}}',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f4f6f9}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#1e40af,#3b82f6);padding:40px 30px;text-align:center;border-radius:16px 16px 0 0}
.header h1{color:#fff;margin:0;font-size:26px;font-weight:700}
.body-card{background:#fff;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,.06)}
.body-card h2{color:#1a1a2e;font-size:20px;margin:0 0 16px}
.body-card p{color:#4a5568;line-height:1.7;font-size:15px;margin:0 0 12px}
.cta-btn{display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:8px 0}
.footer{text-align:center;padding:20px;color:#9ca3af;font-size:12px}
</style></head><body>
<div class="container">
<div class="header"><h1>{{header}}</h1></div>
<div class="body-card">
{{content}}
</div>
<div class="footer"><p>© {{year}} {{company}}. All rights reserved.</p>
<p style="margin:4px 0"><a href="{{unsubscribeUrl}}" style="color:#9ca3af">Unsubscribe</a></p></div>
</div></body></html>`,
  },
  leadAlert: {
    name: 'New Lead Alert',
    subject: '🔥 New Lead: {{contactName}} — Act Fast!',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f4f6f9}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#dc2626,#ef4444);padding:40px 30px;text-align:center;border-radius:16px 16px 0 0}
.header h1{color:#fff;margin:0;font-size:26px;font-weight:700}
.header p{color:rgba(255,255,255,.85);margin-top:8px}
.body-card{background:#fff;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,.06)}
.lead-info{background:#fef2f2;padding:16px;border-radius:12px;border:1px solid #fecaca;margin:16px 0}
.lead-info strong{color:#991b1b}
.badge{display:inline-block;background:#dc2626;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
.cta-btn{display:inline-block;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:8px 0}
.footer{text-align:center;padding:20px;color:#9ca3af;font-size:12px}
</style></head><body>
<div class="container">
<div class="header"><h1>🔥 New Lead Alert</h1><p>Speed wins — reply within the first 5 minutes</p></div>
<div class="body-card">
<h2>Hey {{name}}!</h2>
<div class="lead-info">
<span class="badge">NEW LEAD</span><br><br>
<strong>{{contactName}}</strong><br>
<span style="color:#6b7280;font-size:13px">{{contactPhone}} · {{contactChannel}}</span><br>
<span style="color:#6b7280;font-size:13px">Stage: {{contactStage}}</span>
</div>
<p>A new lead just landed in your inbox. First impressions matter — reach out now to start the conversation!</p>
<a href="{{dashboardUrl}}" class="cta-btn">View Lead →</a>
</div>
<div class="footer"><p>© {{year}} {{company}}. All rights reserved.</p></div>
</div></body></html>`,
  },
  weeklyReport: {
    name: 'Weekly Performance Report',
    subject: '📊 Your Weekly Sales Report is Ready',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f4f6f9}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#4f46e5,#6366f1);padding:40px 30px;text-align:center;border-radius:16px 16px 0 0}
.header h1{color:#fff;margin:0;font-size:26px;font-weight:700}
.body-card{background:#fff;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,.06)}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
.stat-item{background:#f8fafc;padding:16px;border-radius:12px;text-align:center}
.stat-item .num{font-size:28px;font-weight:700;color:#4f46e5}
.stat-item .label{font-size:12px;color:#6b7280;margin-top:4px}
.cta-btn{display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:8px 0}
.footer{text-align:center;padding:20px;color:#9ca3af;font-size:12px}
</style></head><body>
<div class="container">
<div class="header"><h1>📊 Weekly Performance</h1><p>{{dateRange}}</p></div>
<div class="body-card">
<h2>Hey {{name}}!</h2>
<p>Here's your team's performance snapshot for this week.</p>
<div class="stat-grid">
<div class="stat-item"><div class="num">{{newLeads}}</div><div class="label">New Leads</div></div>
<div class="stat-item"><div class="num">{{messagesSent}}</div><div class="label">Messages Sent</div></div>
<div class="stat-item"><div class="num">{{followupsDue}}</div><div class="label">Follow-ups Due</div></div>
<div class="stat-item"><div class="num">{{closedDeals}}</div><div class="label">Closed Deals</div></div>
</div>
<a href="{{dashboardUrl}}" class="cta-btn">View Full Report →</a>
</div>
<div class="footer"><p>© {{year}} {{company}}. All rights reserved.</p></div>
</div></body></html>`,
  },
  meetingRequest: {
    name: 'Meeting / Demo Request',
    subject: '📅 Meeting Request: {{contactName}} wants to connect',
    body: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f4f6f9}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#7c3aed,#8b5cf6);padding:40px 30px;text-align:center;border-radius:16px 16px 0 0}
.header h1{color:#fff;margin:0;font-size:26px;font-weight:700}
.body-card{background:#fff;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,.06)}
.contact-info{background:#f5f3ff;padding:16px;border-radius:12px;border:1px solid #ddd6fe;margin:16px 0}
.cta-btn{display:inline-block;background:linear-gradient(135deg,#7c3aed,#8b5cf6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:8px 0}
.footer{text-align:center;padding:20px;color:#9ca3af;font-size:12px}
</style></head><body>
<div class="container">
<div class="header"><h1>📅 Meeting Request</h1></div>
<div class="body-card">
<h2>Hey {{name}}!</h2>
<div class="contact-info">
<strong>{{contactName}}</strong> wants to schedule a meeting<br>
<span style="color:#6b7280;font-size:13px">📞 {{contactPhone}}</span>
</div>
<p>Don't keep them waiting — respond quickly to lock in the meeting and move the deal forward.</p>
<a href="{{dashboardUrl}}" class="cta-btn">Respond Now →</a>
</div>
<div class="footer"><p>© {{year}} {{company}}. All rights reserved.</p></div>
</div></body></html>`,
  },
};

export type TemplateKey = keyof typeof EMAIL_TEMPLATES;

// ─── Template Variable Replacement ─────────────────────────────────

export function renderTemplate(
  html: string,
  variables: Record<string, string>
): string {
  let rendered = html;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  // Replace any remaining template variables with empty string
  rendered = rendered.replace(/\{\{\w+\}\}/g, '');
  return rendered;
}

// ─── Get SMTP Config ──────────────────────────────────────────────

export async function getTransporter(workspaceId: string) {
  const smtp = await prisma.smtpConfig.findUnique({
    where: { workspaceId },
  });

  if (!smtp) {
    // Fall back to env config
    if (process.env.SMTP_USER) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        },
      });
    }
    return null;
  }

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
}

export async function getSenderInfo(workspaceId: string) {
  const smtp = await prisma.smtpConfig.findUnique({
    where: { workspaceId },
  });

  if (smtp?.fromEmail) {
    return {
      from: smtp.fromName ? `"${smtp.fromName}" <${smtp.fromEmail}>` : smtp.fromEmail,
      replyTo: smtp.fromEmail,
    };
  }

  return {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@signhify.com',
    replyTo: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@signhify.com',
  };
}

// ─── Send Single Email ────────────────────────────────────────────

export async function sendEmail(
  workspaceId: string,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    const transporter = await getTransporter(workspaceId);
    if (!transporter) {
      logger.warn('No SMTP configured for workspace', { workspaceId, to, subject });
      return false;
    }

    const sender = await getSenderInfo(workspaceId);

    await transporter.sendMail({
      from: sender.from,
      replyTo: sender.replyTo,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    logger.info('Email sent successfully', { workspaceId, to, subject });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { workspaceId, to, subject, error });
    return false;
  }
}

// ─── Create & Send Campaign ───────────────────────────────────────

export async function sendCampaign(campaignId: string) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    logger.error('Campaign not found', { campaignId });
    return false;
  }

  const { workspaceId, subject, bodyHtml, bodyText } = campaign;

  // Determine recipients - filter out contacts without emails
  interface ContactWithEmail {
    id: string;
    email: string;
    name?: string | null;
  }

  async function findContactsWithEmail(where: Record<string, unknown>): Promise<ContactWithEmail[]> {
    const results = await prisma.contact.findMany({
      where: where as any,
      select: { id: true, email: true, name: true },
    });
    // TypeScript doesn't narrow email despite `email: { not: null }`, so filter + map
    return results
      .filter((c): c is typeof c & { email: string } => c.email !== null)
      .map((c) => ({ id: c.id, email: c.email, name: c.name }));
  }

  let contacts: ContactWithEmail[];

  if (campaign.recipientFilter) {
    try {
      const filter = JSON.parse(campaign.recipientFilter);
      const where: Record<string, unknown> = { workspaceId, email: { not: null } };

      if (filter.stage) where.stage = filter.stage;
      if (filter.tags) where.tags = { contains: filter.tags };
      if (filter.contactIds?.length) where.id = { in: filter.contactIds };

      contacts = await findContactsWithEmail(where);
    } catch {
      contacts = await findContactsWithEmail({ workspaceId, email: { not: null } });
    }
  } else {
    contacts = await findContactsWithEmail({ workspaceId, email: { not: null } });
  }

  if (contacts.length === 0) {
    logger.warn('No contacts with emails found for campaign', { campaignId });
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'failed', totalRecipients: 0 },
    });
    return false;
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: 'sending', totalRecipients: contacts.length },
  });

  // Create log entries
  const logEntries = contacts
    .filter((c) => c.email)
    .map((c) => ({
      campaignId,
      contactId: c.id,
      email: c.email!,
      status: 'pending' as const,
    }));

  if (logEntries.length === 0) {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'failed', failedCount: 0 },
    });
    return false;
  }

  // Get reusable transporter once
  const transporter = await getTransporter(workspaceId);
  if (!transporter) {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'failed', failedCount: logEntries.length },
    });
    logger.error('No SMTP configured for campaign send', { campaignId });
    return false;
  }

  const sender = await getSenderInfo(workspaceId);
  const frontendUrl = process.env.FRONTEND_URL || 'https://whatsapp-crm-frontend-three.vercel.app';
  const companyName = process.env.COMPANY_NAME || 'Signhify CRM';
  const currentYear = String(new Date().getFullYear());

  let sentCount = 0;
  let failedCount = 0;

  // Send in batches of 50 to avoid overwhelming the SMTP server
  const BATCH_SIZE = 50;
  for (let batchStart = 0; batchStart < logEntries.length; batchStart += BATCH_SIZE) {
    const batch = logEntries.slice(batchStart, batchStart + BATCH_SIZE);

    const batchPromises = batch.map(async (entry) => {
      try {
        const contact = contacts.find((c) => c.id === entry.contactId);
        const defaultVars = {
          name: contact?.name || 'there',
          email: entry.email,
          company: companyName,
          year: currentYear,
          dashboardUrl: frontendUrl,
          unsubscribeUrl: `${frontendUrl}/settings?tab=email`,
          header: campaign.name,
          content: bodyHtml,
          dateRange: 'This Week',
          newLeads: '0',
          messagesSent: '0',
          followupsDue: '0',
          closedDeals: '0',
          contactName: contact?.name || 'A contact',
          contactPhone: '',
          contactChannel: '',
          contactStage: '',
          note: '',
          subject: subject,
        };

        const personalizedHtml = renderTemplate(bodyHtml, defaultVars);
        const emailSubject = renderTemplate(subject, defaultVars);

        await transporter.sendMail({
          from: sender.from,
          replyTo: sender.replyTo,
          to: entry.email,
          subject: emailSubject,
          html: personalizedHtml,
          text: bodyText || personalizedHtml.replace(/<[^>]*>/g, ''),
        });

        await prisma.emailLog.create({
          data: { ...entry, status: 'sent', sentAt: new Date() },
        });
        return 'sent' as const;
      } catch (error: any) {
        await prisma.emailLog.create({
          data: { ...entry, status: 'failed', error: error.message },
        });
        return 'failed' as const;
      }
    });

    const results = await Promise.all(batchPromises);
    for (const result of results) {
      if (result === 'sent') sentCount++;
      else failedCount++;
    }
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: failedCount === logEntries.length ? 'failed' : 'sent',
      sentAt: new Date(),
      sentCount,
      failedCount,
    },
  });

  return true;
}

// ─── Send Automated Email by Trigger ──────────────────────────────

export async function triggerAutomatedEmail(
  workspaceId: string,
  trigger: string,
  variables: Record<string, string>,
  targetEmail: string
): Promise<boolean> {
  try {
    const rules = await prisma.emailAutomationRule.findMany({
      where: { workspaceId, trigger, isActive: true },
    });

    if (rules.length === 0) return false;

    let allSent = true;
    for (const rule of rules) {
      const html = renderTemplate(rule.bodyHtml, variables);
      const subject = renderTemplate(rule.subject, variables);
      const sent = await sendEmail(workspaceId, targetEmail, subject, html);
      if (!sent) allSent = false;
    }

    return allSent;
  } catch (error) {
    logger.error('Trigger automated email error', { workspaceId, trigger, error });
    return false;
  }
}

// ─── Send Team Notification ───────────────────────────────────────

export async function sendTeamNotification(
  workspaceId: string,
  subject: string,
  html: string,
  excludeUserId?: string
): Promise<void> {
  try {
    const transporter = await getTransporter(workspaceId);
    if (!transporter) return;
    const sender = await getSenderInfo(workspaceId);
    const frontendUrl = process.env.FRONTEND_URL || 'https://whatsapp-crm-frontend-three.vercel.app';
    const currentYear = String(new Date().getFullYear());

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    for (const member of members) {
      if (excludeUserId && member.userId === excludeUserId) continue;
      if (!member.user.email) continue;

      const defaultVars = {
        name: member.user.name || 'Team Member',
        email: member.user.email,
        company: process.env.COMPANY_NAME || 'Signhify CRM',
        year: currentYear,
        dashboardUrl: frontendUrl,
      };

      try {
        await transporter.sendMail({
          from: sender.from,
          replyTo: sender.replyTo,
          to: member.user.email,
          subject: renderTemplate(subject, defaultVars),
          html: renderTemplate(html, defaultVars),
        });
        logger.info('Team notification sent', { to: member.user.email, subject });
      } catch (err) {
        logger.error('Failed to send team notification', { to: member.user.email, error: err });
      }
    }
  } catch (error) {
    logger.error('Send team notification error', { workspaceId, subject, error });
  }
}
