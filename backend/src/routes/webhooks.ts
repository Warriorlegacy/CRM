import { Router } from 'express';
import { env } from '../env';
import { handleWhatsAppWebhook } from '../whatsapp/webhook';
import { handleInstagramWebhook } from '../instagram/webhook';

export const webhooksRouter = Router();

// ── WhatsApp Webhook ──────────────────────────────────────────

webhooksRouter.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WA_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: 'Forbidden' });
});

webhooksRouter.post('/webhook', async (req, res) => {
  try {
    const result = await handleWhatsAppWebhook(req.body);
    return res.status(200).json(result);
  } catch (e: any) {
    console.error('WhatsApp webhook error:', e?.message || e);
    return res.status(500).json({ error: 'Webhook failed' });
  }
});

// ── Instagram Webhook ─────────────────────────────────────────

webhooksRouter.get('/webhook/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.IG_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: 'Forbidden' });
});

webhooksRouter.post('/webhook/instagram', async (req, res) => {
  try {
    const result = await handleInstagramWebhook(req.body);
    return res.status(200).json(result);
  } catch (e: any) {
    console.error('Instagram webhook error:', e?.message || e);
    return res.status(500).json({ error: 'Instagram webhook failed' });
  }
});
