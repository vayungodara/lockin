import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyCronSecret } from '@/lib/cronAuth';

function mockRequest(authHeader) {
  return {
    headers: {
      get: (name) => (name === 'authorization' ? authHeader : null),
    },
  };
}

describe('verifyCronSecret', () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-123';
  });

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.CRON_SECRET = originalSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  it('returns authorized for correct Bearer token', () => {
    const result = verifyCronSecret(mockRequest('Bearer test-secret-123'));
    expect(result.authorized).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('returns unauthorized when authorization header is missing', () => {
    const result = verifyCronSecret(mockRequest(null));
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized when CRON_SECRET env var is not set', () => {
    delete process.env.CRON_SECRET;
    const result = verifyCronSecret(mockRequest('Bearer some-token'));
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized for incorrect token of same length', () => {
    const result = verifyCronSecret(mockRequest('Bearer test-secret-999'));
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized for token with different length', () => {
    const result = verifyCronSecret(mockRequest('Bearer short'));
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized when both header and secret are empty strings', () => {
    process.env.CRON_SECRET = '';
    const result = verifyCronSecret(mockRequest(''));
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized for missing Bearer prefix', () => {
    const result = verifyCronSecret(mockRequest('test-secret-123'));
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });
});
