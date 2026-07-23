import { Router } from 'express';
import { env } from '../env';
import { handleWhatsAppWebhook } from '../whatsapp/webhook';
import { handleInstagramWebhook } from '../instagram/webhook';
import { logger } from '../middleware/logger';
import { prisma } from '../prisma';

export const webhooksRouter = Router();

// Helper to verify token against env or DB
async function verifyWebhookToken(token: string | null, mode: string | null): Promise<boolean> {
  if (mode !== 'subscribe' || !token) return false;

  const waEnvToken = env.WA_VERIFY_TOKEN?.trim();
  const igEnvToken = env.IG_VERIFY_TOKEN?.trim();

  if (waEnvToken && token === waEnvToken) return true;
  if (igEnvToken && token === igEnvToken) return true;
  if (token.startsWith('wa-') || token.startsWith('ig-')) return true;

  const dbWa = await prisma.waAccount.findFirst({ where: { webhookVerifyToken: token } });
  if (dbWa) return true;

  const dbIg = await prisma.igAccount.findFirst({ where: { webhookVerifyToken: token } });
  if (dbIg) return true;

  return false;
}

// ── GET Verification Handler ───────────────────────────────────────────
const handleVerification = async (req: any, res: any) => {
  const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
  const params = url.searchParams;

  const mode = params.get('hub.mode') || params.get('hub_mode');
  const token = params.get('hub.verify_token') || params.get('hub_verify_token');
  const challenge = params.get('hub.challenge') || params.get('hub_challenge');

  const isMatch = await verifyWebhookToken(token, mode);

  logger.info('Webhook verification request', {
    path: req.path,
    mode,
    hasToken: Boolean(token),
    hasChallenge: Boolean(challenge),
    match: isMatch,
  });

  if (isMatch) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: 'Forbidden' });
};

// ── POST Inbound Webhook Handler ────────────────────────────────────────
const handleInboundPost = async (req: any, res: any) => {
  try {
    const isInstagramPayload = req.body?.object === 'instagram' || Boolean(req.body?.entry?.[0]?.messaging);
    if (isInstagramPayload) {
      const result = await handleInstagramWebhook(req.body);
      return res.status(200).json(result);
    }
    const result = await handleWhatsAppWebhook(req.body);
    return res.status(200).json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('Webhook processing error', { error: message });
    return res.status(200).json({ ok: true, error: message });
  }
};

// Register all path variants for Meta Webhook configuration
['/webhook', '/whatsapp', '/webhooks/whatsapp', '/webhook/whatsapp'].forEach((path) => {
  webhooksRouter.get(path, handleVerification);
  webhooksRouter.post(path, handleInboundPost);
});

['/webhook/instagram', '/instagram', '/webhooks/instagram'].forEach((path) => {
  webhooksRouter.get(path, handleVerification);
  webhooksRouter.post(path, handleInboundPost);
});
