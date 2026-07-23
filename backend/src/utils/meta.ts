import crypto from 'crypto';
import { env } from '../env';

/**
 * Calculates Meta Graph API appsecret_proof HMAC-SHA256 hash using the access token and Meta App Secret.
 * Required by Meta Graph API when "Require App Secret" setting is enabled in Meta App Dashboard.
 */
export function getAppSecretProof(accessToken: string): string | undefined {
  if (!env.META_APP_SECRET || !accessToken) return undefined;
  return crypto
    .createHmac('sha256', env.META_APP_SECRET)
    .update(accessToken)
    .digest('hex');
}

/**
 * Returns request params object with appsecret_proof attached if META_APP_SECRET is configured.
 */
export function withAppSecretProof(accessToken: string, extraParams: Record<string, any> = {}): Record<string, any> {
  const proof = getAppSecretProof(accessToken);
  return {
    ...extraParams,
    ...(proof ? { appsecret_proof: proof } : {}),
  };
}
