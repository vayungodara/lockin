import { describe, it, expect, vi } from 'vitest';
import { sendReminderEmail } from '@/lib/email';

const mockSend = vi.fn();

vi.mock('resend', () => ({
  Resend: class MockResend {
    constructor() {
      this.emails = { send: mockSend };
    }
  },
}));

describe('sendReminderEmail', () => {
  it('returns success with emailId on happy path', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'email-123' }, error: null });

    const result = await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Finish homework',
      deadline: '2024-06-16T12:00:00Z',
      userName: 'Alice',
    });

    expect(result.success).toBe(true);
    expect(result.emailId).toBe('email-123');
  });

  it('returns failure when Resend returns an error', async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid API key' },
    });

    const result = await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Study math',
      deadline: '2024-06-16T12:00:00Z',
      userName: 'Bob',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('returns failure when send throws an exception', async () => {
    mockSend.mockRejectedValueOnce(new Error('Network failure'));

    const result = await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Read chapter 5',
      deadline: '2024-06-16T12:00:00Z',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network failure');
  });

  it('escapes HTML in pact title to prevent XSS', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'email-456' }, error: null });

    await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: '<script>alert("xss")</script>',
      deadline: '2024-06-16T12:00:00Z',
      userName: 'Test',
    });

    const sentHtml = mockSend.mock.calls[mockSend.mock.calls.length - 1][0].html;
    expect(sentHtml).toContain('&lt;script&gt;');
    expect(sentHtml).not.toContain('<script>alert');
  });

  it('escapes HTML in userName', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'email-789' }, error: null });

    await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Study',
      deadline: '2024-06-16T12:00:00Z',
      userName: '<b>Evil</b>',
    });

    const sentHtml = mockSend.mock.calls[mockSend.mock.calls.length - 1][0].html;
    expect(sentHtml).toContain('&lt;b&gt;Evil&lt;/b&gt;');
    expect(sentHtml).not.toContain('<b>Evil</b>');
  });

  it('handles missing userName gracefully', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'email-abc' }, error: null });

    const result = await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Do laundry',
      deadline: '2024-06-16T12:00:00Z',
    });

    expect(result.success).toBe(true);
    const sentHtml = mockSend.mock.calls[mockSend.mock.calls.length - 1][0].html;
    expect(sentHtml).toContain('Hey,');
  });

  it('includes the correct subject line with pact title', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'email-sub' }, error: null });

    await sendReminderEmail({
      to: 'user@example.com',
      pactTitle: 'Submit essay',
      deadline: '2024-06-16T12:00:00Z',
    });

    const sentArgs = mockSend.mock.calls[mockSend.mock.calls.length - 1][0];
    expect(sentArgs.subject).toContain('Submit essay');
    expect(sentArgs.to).toEqual(['user@example.com']);
    expect(sentArgs.from).toContain('LockIn');
  });
});
