import { Router } from 'express';
import { env } from '../env';
import { handleWhatsAppWebhook } from '../whatsapp/webhook';
import { handleInstagramWebhook } from '../instagram/webhook';

function parseQuery(url: string): Record<string, string> {
  const qs = url.split('?')[1] || '';
  const result: Record<string, string> = {};
  for (const part of qs.split('&')) {
    const [key, ...rest] = part.split('=');
    if (key) result[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
  }
  return result;
}

export const webhooksRouter = Router();

// ── WhatsApp Webhook ──────────────────────────────────────────

webhooksRouter.get('/webhook', (req, res) => {
  const q = parseQuery(req.url);
  const mode = q['hub.mode'];
  const token = q['hub.verify_token'];
  const challenge = q['hub.challenge'];

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
  const q = parseQuery(req.url);
  const mode = q['hub.mode'];
  const token = q['hub.verify_token'];
  const challenge = q['hub.challenge'];

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
