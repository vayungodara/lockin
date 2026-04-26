import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyCronSecret } from '@/lib/cronAuth';

describe('verifyCronSecret', () => {
  const ORIGINAL_ENV = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-123';
  });

  afterEach(() => {
    if (ORIGINAL_ENV !== undefined) {
      process.env.CRON_SECRET = ORIGINAL_ENV;
    } else {
      delete process.env.CRON_SECRET;
    }
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

  it('returns authorized for correct Bearer token', () => {
    const request = makeRequest('Bearer test-secret-123');
    const result = verifyCronSecret(request);

    expect(result.authorized).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('returns unauthorized when CRON_SECRET is not set', () => {
    delete process.env.CRON_SECRET;
    const request = makeRequest('Bearer anything');
    const result = verifyCronSecret(request);

    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized when authorization header is missing', () => {
    const request = makeRequest(null);
    const result = verifyCronSecret(request);

    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized for wrong token', () => {
    const request = makeRequest('Bearer wrong-secret');
    const result = verifyCronSecret(request);

    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized when token length differs', () => {
    const request = makeRequest('Bearer short');
    const result = verifyCronSecret(request);

    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized for non-Bearer scheme', () => {
    const request = makeRequest('Basic test-secret-123');
    const result = verifyCronSecret(request);

    expect(result.authorized).toBe(false);
  });
});
