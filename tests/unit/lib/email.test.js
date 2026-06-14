import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      constructor() {
        this.emails = { send: mockSend };
      }
    },
  };
});

const { sendReminderEmail } = await import('@/lib/email');

describe('sendReminderEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('returns success with emailId on happy path', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

    const result = await sendReminderEmail({
      to: 'test@example.com',
      pactTitle: 'Finish homework',
      deadline: '2024-06-16T12:00:00Z',
      userName: 'Alice',
    });

    expect(result.success).toBe(true);
    expect(result.emailId).toBe('email-123');
  });

  it('returns failure when Resend returns an error', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'rate limited' } });

    const result = await sendReminderEmail({
      to: 'test@example.com',
      pactTitle: 'Study',
      deadline: '2024-06-16T12:00:00Z',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('rate limited');
  });

  it('returns failure when send throws', async () => {
    mockSend.mockRejectedValue(new Error('network error'));

    const result = await sendReminderEmail({
      to: 'test@example.com',
      pactTitle: 'Study',
      deadline: '2024-06-16T12:00:00Z',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('network error');
  });

  it('sends email with correct recipient and subject', async () => {
    mockSend.mockResolvedValue({ data: { id: 'e1' }, error: null });

    await sendReminderEmail({
      to: 'alice@example.com',
      pactTitle: 'Read chapter 5',
      deadline: '2024-06-16T18:00:00Z',
      userName: 'Alice',
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.to).toEqual(['alice@example.com']);
    expect(callArg.subject).toContain('Read chapter 5');
    expect(callArg.html).toContain('Read chapter 5');
  });

  it('handles missing userName gracefully', async () => {
    mockSend.mockResolvedValue({ data: { id: 'e2' }, error: null });

    const result = await sendReminderEmail({
      to: 'test@example.com',
      pactTitle: 'Do laundry',
      deadline: '2024-06-16T12:00:00Z',
    });

    expect(result.success).toBe(true);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('Hey,');
  });

  it('escapes HTML in pactTitle and userName', async () => {
    mockSend.mockResolvedValue({ data: { id: 'e3' }, error: null });

    await sendReminderEmail({
      to: 'test@example.com',
      pactTitle: '<script>alert("xss")</script>',
      deadline: '2024-06-16T12:00:00Z',
      userName: '<b>Evil</b>',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).not.toContain('<script>');
    expect(callArg.html).toContain('&lt;script&gt;');
    expect(callArg.html).not.toContain('<b>Evil</b>');
    expect(callArg.html).toContain('&lt;b&gt;Evil&lt;/b&gt;');
  });
});
