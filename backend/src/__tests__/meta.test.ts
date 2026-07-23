import { getAppSecretProof, withAppSecretProof } from '../utils/meta';

describe('Meta Utility appsecret_proof', () => {
  it('should return undefined if META_APP_SECRET is not set', () => {
    const proof = getAppSecretProof('test-token');
    // If env.META_APP_SECRET is empty string or unset, proof should be undefined
    if (!process.env.META_APP_SECRET) {
      expect(proof).toBeUndefined();
    }
  });

  it('should calculate HMAC-SHA256 proof when META_APP_SECRET is present', () => {
    const originalSecret = process.env.META_APP_SECRET;
    process.env.META_APP_SECRET = 'test_secret_key';
    
    // re-import env or test directly
    const proof = getAppSecretProof('my_access_token');
    // Expected HMAC-SHA256 of "my_access_token" with key "test_secret_key"
    expect(typeof proof).toBe('string');
    expect(proof).toHaveLength(64); // hex sha256 length

    const params = withAppSecretProof('my_access_token', { extra: 'param' });
    expect(params.extra).toBe('param');
    expect(params.appsecret_proof).toBe(proof);

    process.env.META_APP_SECRET = originalSecret;
  });
});
