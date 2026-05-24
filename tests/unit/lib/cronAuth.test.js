import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyCronSecret } from '@/lib/cronAuth';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

function mockRequest(authHeader) {
  return {
    headers: {
      get: vi.fn((name) => {
        if (name === 'authorization') return authHeader;
        return null;
      }),
    },
  };
}

describe('verifyCronSecret', () => {
  it('returns authorized true when token matches', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const request = mockRequest('Bearer my-secret-123');

    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('returns unauthorized when CRON_SECRET is not set', () => {
    delete process.env.CRON_SECRET;
    const request = mockRequest('Bearer some-token');

    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized when authorization header is missing', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const request = mockRequest(null);

    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized when token does not match', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const request = mockRequest('Bearer wrong-secret');

    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized when token has different length', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const request = mockRequest('Bearer short');

    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('returns unauthorized when both CRON_SECRET and header are missing', () => {
    delete process.env.CRON_SECRET;
    const request = mockRequest(null);

    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('returns unauthorized when header is empty string', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const request = mockRequest('');

    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });
});
