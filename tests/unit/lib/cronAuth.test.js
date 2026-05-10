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

  function makeRequest(authHeader) {
    return {
      headers: {
        get: vi.fn((name) => {
          if (name === 'authorization') return authHeader;
          return null;
        }),
      },
    };
  }

  it('returns authorized: true for valid Bearer token', () => {
    const request = makeRequest('Bearer test-secret-123');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('returns authorized: false when authorization header is missing', () => {
    const request = makeRequest(null);
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns authorized: false when CRON_SECRET env var is not set', () => {
    delete process.env.CRON_SECRET;
    const request = makeRequest('Bearer anything');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('returns authorized: false for wrong token', () => {
    const request = makeRequest('Bearer wrong-secret');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('returns authorized: false for token with wrong prefix', () => {
    const request = makeRequest('Basic test-secret-123');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('returns authorized: false for empty authorization header', () => {
    const request = makeRequest('');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('returns a Response with 401 status on failure', async () => {
    const request = makeRequest('Bearer wrong');
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
    const body = await result.response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(result.response.status).toBe(401);
  });
});
