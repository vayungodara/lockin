import { Resend } from 'resend';

// Lazy-load Resend client (only when actually sending emails)
let resend = null;
function getResendClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// App URL for links in emails
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lockin.vercel.app';

/**
 * Generate branded HTML email template for pact reminders
 */
function generateReminderEmailHtml({ pactTitle, deadline, userName }) {
  const formattedDeadline = new Date(deadline).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pact Reminder - LockIn</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F4F5F7;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #F4F5F7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #D946EF 100%); padding: 32px 24px; text-align: center;">
              <img src="${APP_URL}/logo-text.png" alt="LockIn" style="height: 32px; margin-bottom: 16px;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 600;">
                ⏰ Reminder
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0 0 24px 0; color: #5E6168; font-size: 16px; line-height: 1.5;">
                Hey${userName ? ` ${userName}` : ''},
              </p>

              <p style="margin: 0 0 24px 0; color: #5E6168; font-size: 16px; line-height: 1.5;">
                Your pact deadline is coming up in less than 24 hours!
              </p>

              <!-- Pact card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(217, 70, 239, 0.08) 100%); border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #8B8F96; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Your Pact
                    </p>
                    <p style="margin: 0 0 16px 0; color: #1A1D21; font-size: 18px; font-weight: 600;">
                      ${escapeHtml(pactTitle)}
                    </p>
                    <p style="margin: 0; color: #5E6168; font-size: 14px;">
                      📅 Due: <strong style="color: #6366F1;">${formattedDeadline}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #D946EF 100%); color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">
                      View in LockIn →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #FAFBFC; border-top: 1px solid #ECEEF1;">
              <p style="margin: 0; color: #8B8F96; font-size: 13px; text-align: center; line-height: 1.5;">
                You're receiving this because you have an active pact on LockIn.<br>
                <a href="${APP_URL}" style="color: #6366F1; text-decoration: none;">Visit LockIn</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML to prevent XSS in email content
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Send a pact reminder email
 * @returns {Promise<{success: boolean, emailId?: string, error?: string}>}
 */
export async function sendReminderEmail({ to, pactTitle, deadline, userName }) {
  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: 'LockIn <reminders@lockin.app>',
      to: [to],
      subject: `⏰ Reminder: "${pactTitle}" is due soon!`,
      html: generateReminderEmailHtml({ pactTitle, deadline, userName }),
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: err.message };
  }
}
