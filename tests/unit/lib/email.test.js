import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('resend', () => {
  return {
    Resend: function () {
      this.emails = { send: mockSend };
    },
  };
});

import { sendReminderEmail } from '@/lib/email';

describe('sendReminderEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('returns success with emailId on successful send', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

    const result = await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Study for exam',
      deadline: '2024-06-15T18:00:00Z',
      userName: 'Alice',
    });

    expect(result.success).toBe(true);
    expect(result.emailId).toBe('email-123');
  });

  it('includes pact title and user name in the email', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-456' }, error: null });

    await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Finish homework',
      deadline: '2024-06-15T18:00:00Z',
      userName: 'Bob',
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.to).toEqual(['user@example.com']);
    expect(callArgs.subject).toContain('Finish homework');
    expect(callArgs.html).toContain('Finish homework');
    expect(callArgs.html).toContain('Bob');
  });

  it('returns error when Resend returns an error', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Invalid recipient' } });

    const result = await sendReminderEmail({
      to: 'bad@example.com',
      pactTitle: 'Test',
      deadline: '2024-06-15T18:00:00Z',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid recipient');
  });

  it('returns error when send throws an exception', async () => {
    mockSend.mockRejectedValue(new Error('Network timeout'));

    const result = await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Test',
      deadline: '2024-06-15T18:00:00Z',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network timeout');
  });

  it('escapes HTML special characters in pact title', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-789' }, error: null });

    await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: '<script>alert("xss")</script>',
      deadline: '2024-06-15T18:00:00Z',
      userName: 'Test & "User"',
    });

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).not.toContain('<script>');
    expect(callArgs.html).toContain('&lt;script&gt;');
    expect(callArgs.html).toContain('Test &amp; &quot;User&quot;');
  });

  it('handles missing userName gracefully', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-000' }, error: null });

    const result = await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Test pact',
      deadline: '2024-06-15T18:00:00Z',
    });

    expect(result.success).toBe(true);
    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).toContain('Hey,');
  });
});
