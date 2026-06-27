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

  it('authorizes when header matches CRON_SECRET', () => {
    const request = {
      headers: { get: vi.fn().mockReturnValue('Bearer test-secret-123') },
    };
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('rejects when header does not match', () => {
    const request = {
      headers: { get: vi.fn().mockReturnValue('Bearer wrong-secret') },
    };
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
    expect(result.response).toBeTruthy();
  });

  it('rejects when no authorization header is provided', () => {
    const request = {
      headers: { get: vi.fn().mockReturnValue(null) },
    };
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('rejects when CRON_SECRET env var is not set', () => {
    delete process.env.CRON_SECRET;
    const request = {
      headers: { get: vi.fn().mockReturnValue('Bearer some-token') },
    };
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('rejects when header length differs from expected', () => {
    const request = {
      headers: { get: vi.fn().mockReturnValue('Bearer short') },
    };
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });

  it('rejects with missing Bearer prefix', () => {
    const request = {
      headers: { get: vi.fn().mockReturnValue('test-secret-123') },
    };
    const result = verifyCronSecret(request);
    expect(result.authorized).toBe(false);
  });
});
