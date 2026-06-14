import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyCronSecret } from '@/lib/cronAuth';

describe('verifyCronSecret', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'my-secret-123' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns authorized for correct bearer token', () => {
    const req = { headers: { get: (key) => key === 'authorization' ? 'Bearer my-secret-123' : null } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('returns unauthorized when no authorization header', () => {
    const req = { headers: { get: () => null } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeTruthy();
  });

  it('returns unauthorized when CRON_SECRET is not set', () => {
    delete process.env.CRON_SECRET;
    const req = { headers: { get: () => 'Bearer something' } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized for token with different length', () => {
    const req = { headers: { get: () => 'Bearer short' } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized for wrong token of same length', () => {
    const req = { headers: { get: () => 'Bearer my-secret-456' } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized when header is empty string', () => {
    const req = { headers: { get: () => '' } };

    const result = verifyCronSecret(req);
    expect(result.authorized).toBe(false);
  });
});
