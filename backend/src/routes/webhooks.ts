import { Router } from 'express';
import { env } from '../env';
import { handleWhatsAppWebhook } from '../whatsapp/webhook';
import { handleInstagramWebhook } from '../instagram/webhook';
import { logger } from '../middleware/logger';

export const webhooksRouter = Router();

// ── WhatsApp Webhook ──────────────────────────────────────────

webhooksRouter.get('/webhook', (req, res) => {
  // Manually parse the query string to avoid Express/qs nesting issues
  const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
  const params = url.searchParams;

  const mode = params.get('hub.mode') || params.get('hub_mode');
  const token = params.get('hub.verify_token') || params.get('hub_verify_token');
  const challenge = params.get('hub.challenge') || params.get('hub_challenge');

  const expectedToken = env.WA_VERIFY_TOKEN?.trim();
  const isMatch = mode === 'subscribe' && token === expectedToken;

  logger.info('WhatsApp webhook verification request', {
    mode,
    hasToken: Boolean(token),
    hasChallenge: Boolean(challenge),
    match: isMatch,
  });

  if (isMatch) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: 'Forbidden' });
});

webhooksRouter.post('/webhook', async (req, res) => {
  try {
    const result = await handleWhatsAppWebhook(req.body);
    return res.status(200).json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('WhatsApp webhook error', { error: message });
    return res.status(500).json({ error: 'Webhook failed' });
  }
});

// ── Instagram Webhook ─────────────────────────────────────────

webhooksRouter.get('/webhook/instagram', (req, res) => {
  const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
  const params = url.searchParams;

  const mode = params.get('hub.mode') || params.get('hub_mode');
  const token = params.get('hub.verify_token') || params.get('hub_verify_token');
  const challenge = params.get('hub.challenge') || params.get('hub_challenge');

  const expectedToken = env.IG_VERIFY_TOKEN?.trim();
  const isMatch = mode === 'subscribe' && token === expectedToken;

  logger.info('Instagram webhook verification request', {
    mode,
    hasToken: Boolean(token),
    hasChallenge: Boolean(challenge),
    match: isMatch,
  });

  if (isMatch) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: 'Forbidden' });
});

webhooksRouter.post('/webhook/instagram', async (req, res) => {
  try {
    const result = await handleInstagramWebhook(req.body);
    return res.status(200).json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('Instagram webhook error', { error: message });
    return res.status(500).json({ error: 'Instagram webhook failed' });
  }
});
