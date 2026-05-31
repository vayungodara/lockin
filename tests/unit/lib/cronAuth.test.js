import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyCronSecret } from '@/lib/cronAuth';

describe('verifyCronSecret', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-123';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function makeRequest(authHeader) {
    return {
      headers: {
        get(name) {
          if (name === 'authorization') return authHeader;
          return null;
        },
      },
    };
  }

  it('returns authorized for valid bearer token', () => {
    const request = makeRequest('Bearer test-secret-123');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('returns unauthorized when no authorization header', () => {
    const request = makeRequest(null);
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeTruthy();
  });

  it('returns unauthorized when CRON_SECRET is not set', () => {
    delete process.env.CRON_SECRET;
    const request = makeRequest('Bearer anything');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized for wrong token', () => {
    const request = makeRequest('Bearer wrong-secret');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized for token with different length', () => {
    const request = makeRequest('Bearer short');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized for missing Bearer prefix', () => {
    const request = makeRequest('test-secret-123');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized when both header and env are empty strings', () => {
    process.env.CRON_SECRET = '';
    const request = makeRequest('');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });
});
