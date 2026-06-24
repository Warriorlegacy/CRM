import { Router } from 'express';
import { env } from '../env';
import { handleWhatsAppWebhook } from '../whatsapp/webhook';
import { handleInstagramWebhook } from '../instagram/webhook';

export const webhooksRouter = Router();

// ── WhatsApp Webhook ──────────────────────────────────────────

webhooksRouter.get('/webhook', (req, res) => {
  const query = req.query;
  
  // Handle both flat and nested query parsing
  const mode = (query['hub.mode'] || (query as any).hub?.mode)?.toString().trim();
  const token = (query['hub.verify_token'] || (query as any).hub?.verify_token)?.toString().trim();
  const challenge = (query['hub.challenge'] || (query as any).hub?.challenge)?.toString().trim();

  const expectedToken = env.WA_VERIFY_TOKEN?.trim();

  console.log('--- WhatsApp Webhook Verification ---');
  console.log('Mode:', mode);
  console.log('Token Received:', token);
  console.log('Token Expected:', expectedToken);
  console.log('Challenge:', challenge);
  console.log('Match:', token === expectedToken);
  console.log('------------------------------------');

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
  const query = req.query;

  // Handle both flat and nested query parsing
  const mode = (query['hub.mode'] || (query as any).hub?.mode)?.toString().trim();
  const token = (query['hub.verify_token'] || (query as any).hub?.verify_token)?.toString().trim();
  const challenge = (query['hub.challenge'] || (query as any).hub?.challenge)?.toString().trim();

  const expectedToken = env.IG_VERIFY_TOKEN?.trim();

  console.log('--- Instagram Webhook Verification ---');
  console.log('Mode:', mode);
  console.log('Token Received:', token);
  console.log('Token Expected:', expectedToken);
  console.log('Challenge:', challenge);
  console.log('Match:', token === expectedToken);
  console.log('------------------------------------');

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
