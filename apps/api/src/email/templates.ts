export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

function layout({ heading, intro, action, url, footer }: { heading: string; intro: string; action: string; url: string; footer: string }) {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#1f1a2e">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px">
          <tr><td>
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#6d28d9">Ekana</p>
            <h1 style="margin:0 0 16px;font-size:22px">${heading}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.5">${intro}</p>
            <p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${action}</a></p>
            <p style="margin:0 0 8px;font-size:13px;color:#6b6280">If the button doesn't work, copy this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:13px;word-break:break-all"><a href="${safeUrl}" style="color:#6d28d9">${safeUrl}</a></p>
            <p style="margin:0;font-size:13px;color:#6b6280">${footer}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail({ name, url }: { name: string; url: string }): EmailContent {
  const footer = "This link expires in 24 hours. If you didn't create an Ekana account, you can ignore this email.";
  return {
    subject: 'Verify your Ekana email',
    text: `Hi ${name},\n\nWelcome to Ekana! Confirm your email address to activate your account:\n${url}\n\n${footer}`,
    html: layout({
      heading: `Hi ${escapeHtml(name)}, welcome to Ekana!`,
      intro: 'Confirm your email address to activate your account and start learning with your team.',
      action: 'Verify email',
      url,
      footer,
    }),
  };
}

export function resetPasswordEmail({ name, url }: { name: string; url: string }): EmailContent {
  const footer = "This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.";
  return {
    subject: 'Reset your Ekana password',
    text: `Hi ${name},\n\nWe received a request to reset your Ekana password. Choose a new one here:\n${url}\n\n${footer}`,
    html: layout({
      heading: `Hi ${escapeHtml(name)},`,
      intro: 'We received a request to reset your Ekana password. Click the button to choose a new one.',
      action: 'Reset password',
      url,
      footer,
    }),
  };
}
