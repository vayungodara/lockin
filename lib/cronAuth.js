import { timingSafeEqual } from 'crypto';

/**
 * Timing-safe comparison of the Authorization header against the CRON_SECRET.
 * Uses crypto.timingSafeEqual to prevent timing side-channel attacks that could
 * leak the secret one character at a time via response-time analysis.
 *
 * @param {Request} request - The incoming request object
 * @returns {{ authorized: boolean, response?: Response }}
 */
export function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader) {
    return {
      authorized: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const expected = `Bearer ${cronSecret}`;

  const bufAuth = Buffer.from(authHeader);
  const bufExpected = Buffer.from(expected);

  // Length difference is safe to leak -- it does not reveal the secret value
  if (bufAuth.length !== bufExpected.length) {
    return {
      authorized: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!timingSafeEqual(bufAuth, bufExpected)) {
    return {
      authorized: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { authorized: true };
}
