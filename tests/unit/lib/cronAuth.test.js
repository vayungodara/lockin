import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyCronSecret } from '@/lib/cronAuth';

describe('verifyCronSecret', () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-123';
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.CRON_SECRET = originalEnv;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  it('returns authorized true for valid Bearer token', () => {
    const request = {
      headers: new Map([['authorization', 'Bearer test-secret-123']]),
    };
    request.headers.get = (key) => request.headers.has(key) ? request.headers.get(key) : null;
    // Use a proper Headers-like object
    const req = { headers: { get: (key) => key === 'authorization' ? 'Bearer test-secret-123' : null } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('returns unauthorized when no authorization header is present', () => {
    const req = { headers: { get: () => null } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized when CRON_SECRET env is not set', () => {
    delete process.env.CRON_SECRET;
    const req = { headers: { get: () => 'Bearer something' } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized for wrong token', () => {
    const req = { headers: { get: (key) => key === 'authorization' ? 'Bearer wrong-secret' : null } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized for token with different length', () => {
    const req = { headers: { get: (key) => key === 'authorization' ? 'Bearer short' : null } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized for empty authorization header', () => {
    const req = { headers: { get: (key) => key === 'authorization' ? '' : null } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
  });
});
