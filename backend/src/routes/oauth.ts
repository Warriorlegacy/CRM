import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { env } from '../env';
import { requireAuth } from '../middleware/auth';

export const oauthRouter = Router();

// ── NEW: Establish OAuth context via httpOnly cookie ──────────────────────
// This endpoint is called via XHR (with Authorization header) before the
// full-page redirect to Meta OAuth. It sets a short-lived httpOnly cookie
// so the backend can identify the user WITHOUT exposing the JWT in the URL.

oauthRouter.post('/establish', requireAuth, (req: Request, res: Response) => {
  const token = (req as any).token as string;

  res.cookie('oauth_context', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 5 * 60 * 1000, // 5 minutes
    path: '/api/v1/oauth',
  });

  return res.json({ ok: true });
});

// ── Helper: exchange short-lived token for long-lived token ─────────────

export async function exchangeForLongLivedToken(shortToken: string): Promise<string> {
  const resp = await axios.get(
    `https://graph.facebook.com/${env.META_API_VERSION}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: env.META_APP_ID,
        client_secret: env.META_APP_SECRET,
        fb_exchange_token: shortToken,
      },
    }
  );
  return resp.data.access_token;
}

// ── Helper: get debug token info ────────────────────────────────────────

async function debugToken(token: string): Promise<{
  userId?: string;
  scopes: string[];
  expiresAt: number;
}> {
  const resp = await axios.get(
    `https://graph.facebook.com/${env.META_API_VERSION}/debug_token`, {
      params: { input_token: token, access_token: `${env.META_APP_ID}|${env.META_APP_SECRET}` },
    }
  );
  return resp.data.data;
}

// ── Helper: fetch WhatsApp Business accounts from user token ────────────

async function fetchWhatsAppAccounts(userToken: string): Promise<{
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  displayName?: string;
}[]> {
  const resp = await axios.get(
    `https://graph.facebook.com/${env.META_API_VERSION}/me/waba_permitted_businesses`, {
      params: {
        access_token: userToken,
        fields: 'id,name',
      },
    }
  );

  const wabaList = resp.data.data || [];
  const accounts: { phoneNumberId: string; businessAccountId: string; accessToken: string; displayName?: string }[] = [];

  for (const waba of wabaList) {
    try {
      const phoneResp = await axios.get(
        `https://graph.facebook.com/${env.META_API_VERSION}/${waba.id}/phone_numbers`, {
          params: {
            access_token: userToken,
            fields: 'id,display_phone_number,verified_name',
          },
        }
      );

      const phones = phoneResp.data.data || [];
      for (const phone of phones) {
        accounts.push({
          phoneNumberId: phone.id,
          businessAccountId: waba.id,
          accessToken: userToken,
          displayName: phone.verified_name || phone.display_phone_number,
        });
      }
    } catch {
      // Skip WABAs where we can't fetch phone numbers
    }
  }

  return accounts;
}

// ── Helper: fetch Instagram Business accounts ───────────────────────────

async function fetchInstagramAccounts(userToken: string): Promise<{
  igUserId: string;
  accessToken: string;
  username?: string;
}[]> {
  try {
    const pagesResp = await axios.get(
      `https://graph.facebook.com/${env.META_API_VERSION}/me/accounts`, {
        params: {
          access_token: userToken,
          fields: 'id,name,instagram_business_account{id,username}',
        },
      }
    );

    const accounts: { igUserId: string; accessToken: string; username?: string }[] = [];
    const pages = pagesResp.data.data || [];

    for (const page of pages) {
      if (page.instagram_business_account) {
        accounts.push({
          igUserId: page.instagram_business_account.id,
          accessToken: userToken,
          username: page.instagram_business_account.username,
        });
      }
    }

    return accounts;
  } catch {
    return [];
  }
}

// ── Helper: generate state token (JWT with nonce + workspaceId) ─────────

function getPublicApiBaseUrl(req: Request): string {
  const configuredUrl =
    process.env.API_PUBLIC_URL ||
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    '';

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  }

  const forwardedProto = req.header('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
}

function getOAuthRedirectUri(req: Request, channel: string): string {
  return `${getPublicApiBaseUrl(req)}/api/v1/oauth/${channel}/callback`;
}

function generateStateToken(workspaceId: string, userId: string, channel: string, redirectUri: string): string {
  return jwt.sign(
    { workspaceId, userId, channel, redirectUri, nonce: crypto.randomBytes(16).toString('hex') },
    env.JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function verifyStateToken(token: string): { workspaceId: string; userId: string; channel: string; redirectUri: string } | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      workspaceId: string;
      userId: string;
      channel: string;
      redirectUri: string;
    };
    return payload;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// WHATSAPP OAUTH
// ══════════════════════════════════════════════════════════════════════════

oauthRouter.get('/whatsapp', async (req: Request, res: Response) => {
  const token =
    (req as any).cookies?.oauth_context ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null) ||
    (typeof req.query.token === 'string' ? req.query.token : null);

  if (!token) {
    return res.redirect(`${env.FRONTEND_URL}/login?returnTo=/setup`);
  }

  let payload: { userId: string; workspaceId: string } | null = null;
  try { payload = jwt.verify(token, env.JWT_SECRET) as any; } catch {}
  if (!payload) {
    return res.redirect(`${env.FRONTEND_URL}/login?returnTo=/setup`);
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: payload.userId, workspaceId: payload.workspaceId },
  });
  if (!member) {
    return res.redirect(`${env.FRONTEND_URL}/login?returnTo=/setup`);
  }

  (req as any).workspaceId = payload.workspaceId;
  (req as any).userId = payload.userId;
  (req as any).token = token;
  const workspaceId = (req as any).workspaceId as string;
  const userId = (req as any).userId as string;
  const redirectUri = getOAuthRedirectUri(req, 'whatsapp');
  const state = generateStateToken(workspaceId, userId, 'whatsapp', redirectUri);
  const scopes = [
    'whatsapp_business_messaging',
    'whatsapp_business_management',
  ].join(',');

  const configParam = env.META_CONFIG_ID ? `&config_id=${env.META_CONFIG_ID}` : '';
  const authUrl = `https://www.facebook.com/${env.META_API_VERSION}/dialog/oauth?` +
    `client_id=${env.META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${state}` +
    `&response_type=code` +
    configParam;

  res.redirect(authUrl);
});

oauthRouter.get('/whatsapp/callback', async (req: Request, res: Response) => {
  const { code, state, error: authError } = req.query;

  if (authError) {
    return res.redirect(`${env.FRONTEND_URL}/setup?whatsapp=error&reason=${encodeURIComponent(String(authError))}`);
  }

  if (!code || !state) {
    return res.redirect(`${env.FRONTEND_URL}/setup?whatsapp=error&reason=missing_params`);
  }

  const statePayload = verifyStateToken(String(state));
  if (!statePayload || statePayload.channel !== 'whatsapp') {
    return res.redirect(`${env.FRONTEND_URL}/setup?whatsapp=error&reason=invalid_state`);
  }

  const { workspaceId, userId, redirectUri } = statePayload;

  try {
    const member = await prisma.workspaceMember.findFirst({ where: { workspaceId, userId } });
    if (!member) {
      return res.redirect(`${env.FRONTEND_URL}/setup?whatsapp=error&reason=workspace_access_denied`);
    }

    // Exchange code for user access token
    const tokenResp = await axios.get(
      `https://graph.facebook.com/${env.META_API_VERSION}/oauth/access_token`, {
        params: {
          client_id: env.META_APP_ID,
          client_secret: env.META_APP_SECRET,
          redirect_uri: redirectUri,
          code: String(code),
        },
      }
    );

    const shortLivedToken = tokenResp.data.access_token;

    // Exchange for long-lived token
    const longLivedToken = await exchangeForLongLivedToken(shortLivedToken);

    // Fetch WhatsApp Business accounts
    const accounts = await fetchWhatsAppAccounts(longLivedToken);

    if (accounts.length === 0) {
      return res.redirect(
        `${env.FRONTEND_URL}/setup?whatsapp=error&reason=no_accounts`
      );
    }

    // Use first available account
    const primary = accounts[0];

    await prisma.waAccount.upsert({
      where: { workspaceId },
      update: {
        phoneNumberId: primary.phoneNumberId,
        businessAccountId: primary.businessAccountId,
        accessToken: longLivedToken,
        webhookVerifyToken: `wa-${crypto.randomBytes(16).toString('hex')}`,
      },
      create: {
        workspaceId,
        phoneNumberId: primary.phoneNumberId,
        businessAccountId: primary.businessAccountId,
        accessToken: longLivedToken,
        webhookVerifyToken: `wa-${crypto.randomBytes(16).toString('hex')}`,
      },
    });

    return res.redirect(`${env.FRONTEND_URL}/setup?whatsapp=connected`);
  } catch (err: any) {
    console.error('WhatsApp OAuth callback error:', err?.response?.data || err.message);
    return res.redirect(
      `${env.FRONTEND_URL}/setup?whatsapp=error&reason=${encodeURIComponent(err?.response?.data?.error?.message || 'token_exchange_failed')}`
    );
  }
});

// ══════════════════════════════════════════════════════════════════════════
// INSTAGRAM OAUTH
// ══════════════════════════════════════════════════════════════════════════

oauthRouter.get('/instagram', async (req: Request, res: Response) => {
  const token =
    (req as any).cookies?.oauth_context ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null) ||
    (typeof req.query.token === 'string' ? req.query.token : null);

  if (!token) {
    return res.redirect(`${env.FRONTEND_URL}/login?returnTo=/setup`);
  }

  let payload: { userId: string; workspaceId: string } | null = null;
  try { payload = jwt.verify(token, env.JWT_SECRET) as any; } catch {}
  if (!payload) {
    return res.redirect(`${env.FRONTEND_URL}/login?returnTo=/setup`);
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: payload.userId, workspaceId: payload.workspaceId },
  });
  if (!member) {
    return res.redirect(`${env.FRONTEND_URL}/login?returnTo=/setup`);
  }

  (req as any).workspaceId = payload.workspaceId;
  (req as any).userId = payload.userId;
  (req as any).token = token;
  const workspaceId = (req as any).workspaceId as string;
  const userId = (req as any).userId as string;
  const redirectUri = getOAuthRedirectUri(req, 'instagram');
  const state = generateStateToken(workspaceId, userId, 'instagram', redirectUri);
  const scopes = [
    'instagram_basic',
    'instagram_manage_messages',
    'pages_messaging',
    'pages_show_list',
  ].join(',');

  const configParam = env.META_CONFIG_ID ? `&config_id=${env.META_CONFIG_ID}` : '';
  const authUrl = `https://www.facebook.com/${env.META_API_VERSION}/dialog/oauth?` +
    `client_id=${env.META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${state}` +
    `&response_type=code` +
    configParam;

  res.redirect(authUrl);
});

oauthRouter.get('/instagram/callback', async (req: Request, res: Response) => {
  const { code, state, error: authError } = req.query;

  if (authError) {
    return res.redirect(`${env.FRONTEND_URL}/setup?instagram=error&reason=${encodeURIComponent(String(authError))}`);
  }

  if (!code || !state) {
    return res.redirect(`${env.FRONTEND_URL}/setup?instagram=error&reason=missing_params`);
  }

  const statePayload = verifyStateToken(String(state));
  if (!statePayload || statePayload.channel !== 'instagram') {
    return res.redirect(`${env.FRONTEND_URL}/setup?instagram=error&reason=invalid_state`);
  }

  const { workspaceId, userId, redirectUri } = statePayload;

  try {
    const member = await prisma.workspaceMember.findFirst({ where: { workspaceId, userId } });
    if (!member) {
      return res.redirect(`${env.FRONTEND_URL}/setup?instagram=error&reason=workspace_access_denied`);
    }

    // Exchange code for user access token
    const tokenResp = await axios.get(
      `https://graph.facebook.com/${env.META_API_VERSION}/oauth/access_token`, {
        params: {
          client_id: env.META_APP_ID,
          client_secret: env.META_APP_SECRET,
          redirect_uri: redirectUri,
          code: String(code),
        },
      }
    );

    const shortLivedToken = tokenResp.data.access_token;

    // Exchange for long-lived token
    const longLivedToken = await exchangeForLongLivedToken(shortLivedToken);

    // Fetch Instagram Business accounts
    const accounts = await fetchInstagramAccounts(longLivedToken);

    if (accounts.length === 0) {
      return res.redirect(
        `${env.FRONTEND_URL}/setup?instagram=error&reason=no_accounts`
      );
    }

    // Use first available account
    const primary = accounts[0];

    await prisma.igAccount.upsert({
      where: { workspaceId },
      update: {
        igUserId: primary.igUserId,
        accessToken: longLivedToken,
        webhookVerifyToken: `ig-${crypto.randomBytes(16).toString('hex')}`,
      },
      create: {
        workspaceId,
        igUserId: primary.igUserId,
        accessToken: longLivedToken,
        webhookVerifyToken: `ig-${crypto.randomBytes(16).toString('hex')}`,
      },
    });

    return res.redirect(`${env.FRONTEND_URL}/setup?instagram=connected`);
  } catch (err: any) {
    console.error('Instagram OAuth callback error:', err?.response?.data || err.message);
    return res.redirect(
      `${env.FRONTEND_URL}/setup?instagram=error&reason=${encodeURIComponent(err?.response?.data?.error?.message || 'token_exchange_failed')}`
    );
  }
});

// ══════════════════════════════════════════════════════════════════════════
// TOKEN REFRESH
// ══════════════════════════════════════════════════════════════════════════

oauthRouter.post('/refresh', requireAuth, async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId as string;
  const { channel } = req.body;

  try {
    if (channel === 'instagram') {
      const ig = await prisma.igAccount.findUnique({ where: { workspaceId } });
      if (!ig) return res.status(404).json({ error: 'Instagram not connected' });

      const newToken = await exchangeForLongLivedToken(ig.accessToken);
      await prisma.igAccount.update({
        where: { workspaceId },
        data: { accessToken: newToken },
      });
      return res.json({ ok: true, message: 'Token refreshed' });
    } else {
      const wa = await prisma.waAccount.findUnique({ where: { workspaceId } });
      if (!wa) return res.status(404).json({ error: 'WhatsApp not connected' });

      const newToken = await exchangeForLongLivedToken(wa.accessToken);
      await prisma.waAccount.update({
        where: { workspaceId },
        data: { accessToken: newToken },
      });
      return res.json({ ok: true, message: 'Token refreshed' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Token refresh failed', details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// CONNECTION STATUS
// ══════════════════════════════════════════════════════════════════════════

oauthRouter.get('/status', requireAuth, async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId as string;

  const [wa, ig] = await Promise.all([
    prisma.waAccount.findUnique({
      where: { workspaceId },
      select: { phoneNumberId: true, businessAccountId: true, webhookVerifyToken: true, createdAt: true },
    }),
    prisma.igAccount.findUnique({
      where: { workspaceId },
      select: { igUserId: true, webhookVerifyToken: true, createdAt: true },
    }),
  ]);

  const host = req.get('host') || '';
  const protocol = req.protocol || 'https';
  const backendUrl = process.env.BACKEND_URL || `${protocol}://${host}`;

  return res.json({
    whatsapp: {
      connected: !!wa,
      phoneNumberId: wa?.phoneNumberId || null,
      businessAccountId: wa?.businessAccountId || null,
      webhookUrl: wa ? `${backendUrl}/webhook` : null,
      webhookVerifyToken: wa?.webhookVerifyToken || null,
      connectedAt: wa?.createdAt || null,
    },
    instagram: {
      connected: !!ig,
      igUserId: ig?.igUserId || null,
      webhookUrl: ig ? `${backendUrl}/webhook/instagram` : null,
      webhookVerifyToken: ig?.webhookVerifyToken || null,
      connectedAt: ig?.createdAt || null,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DISCONNECT
// ══════════════════════════════════════════════════════════════════════════

oauthRouter.delete('/disconnect/:channel', requireAuth, async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId as string;
  const { channel } = req.params;

  if (channel === 'whatsapp') {
    await prisma.waAccount.delete({ where: { workspaceId } }).catch(() => {});
    return res.json({ ok: true, message: 'WhatsApp disconnected' });
  } else if (channel === 'instagram') {
    await prisma.igAccount.delete({ where: { workspaceId } }).catch(() => {});
    return res.json({ ok: true, message: 'Instagram disconnected' });
  }

  return res.status(400).json({ error: 'Invalid channel' });
});

export default oauthRouter;
