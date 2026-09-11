import type { EmailMessage, Mailer } from '../../src/email/mailer.js';

export function createFakeMailer(): Mailer & { sent: EmailMessage[] } {
  const sent: EmailMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

export function emailLink(message: EmailMessage): URL {
  const match = message.text.match(/https?:\/\/\S+/);
  if (!match) throw new Error(`El correo "${message.subject}" no contiene enlace`);
  return new URL(match[0]);
}
