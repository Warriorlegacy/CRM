import { Router } from 'express';
import { env } from '../env';
import { handleWhatsAppWebhook } from '../whatsapp/webhook';
import { handleInstagramWebhook } from '../instagram/webhook';

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

  console.log('--- WhatsApp Webhook Verification (Manual Parse) ---');
  console.log('Mode:', mode);
  console.log('Token Received:', token);
  console.log('Token Expected:', expectedToken);
  console.log('Challenge:', challenge);
  console.log('Match:', token === expectedToken);
  console.log('Full Query String:', url.search);
  console.log('--------------------------------------------------');

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ 
    error: 'Forbidden', 
    debug: process.env.NODE_ENV !== 'production' ? { 
      received: token, 
      expected: expectedToken 
    } : undefined 
  });
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
  const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
  const params = url.searchParams;

  const mode = params.get('hub.mode') || params.get('hub_mode');
  const token = params.get('hub.verify_token') || params.get('hub_verify_token');
  const challenge = params.get('hub.challenge') || params.get('hub_challenge');

  const expectedToken = env.IG_VERIFY_TOKEN?.trim();

  console.log('--- Instagram Webhook Verification (Manual Parse) ---');
  console.log('Mode:', mode);
  console.log('Token Received:', token);
  console.log('Token Expected:', expectedToken);
  console.log('Challenge:', challenge);
  console.log('Match:', token === expectedToken);
  console.log('Full Query String:', url.search);
  console.log('----------------------------------------------------');

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ 
    error: 'Forbidden', 
    debug: process.env.NODE_ENV !== 'production' ? { 
      received: token, 
      expected: expectedToken 
    } : undefined 
  });
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
