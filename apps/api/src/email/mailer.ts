import nodemailer from 'nodemailer';
import type { Config, SmtpConfig } from '../config.js';
import type { EmailContent } from './templates.js';

export interface EmailMessage extends EmailContent {
  to: string;
}

export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const RESEND_TIMEOUT_MS = 10_000;
const MAX_ERROR_DETAIL = 300;

/**
 * Correo por la API HTTPS de Resend. Es el camino de producción: Railway bloquea
 * las conexiones SMTP salientes salvo en el plan Pro.
 */
export function createResendMailer(apiKey: string, from: string, fetchImpl: typeof fetch = fetch): Mailer {
  return {
    async send(message) {
      const response = await fetchImpl(RESEND_ENDPOINT, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
        signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
      });
      if (!response.ok) {
        // El cuerpo trae el motivo (remitente sin verificar, cuota, etc.); nunca la API key.
        const detail = (await response.text().catch(() => '')).slice(0, MAX_ERROR_DETAIL);
        throw new Error(`Resend respondió ${response.status}: ${detail}`);
      }
    },
  };
}

export function createSmtpMailer(smtp: SmtpConfig, from: string): Mailer {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  return {
    async send(message) {
      await transporter.sendMail({ from, to: message.to, subject: message.subject, text: message.text, html: message.html });
    },
  };
}

// Solo desarrollo: config.ts exige Resend o SMTP en producción.
export function createConsoleMailer(log: (line: string) => void = console.info): Mailer {
  return {
    async send(message) {
      log(`\n[email] Para: ${message.to}\n[email] Asunto: ${message.subject}\n${message.text}\n`);
    },
  };
}

export function createMailer(config: Config): Mailer {
  if (config.resendApiKey) return createResendMailer(config.resendApiKey, config.emailFrom);
  if (config.smtp) return createSmtpMailer(config.smtp, config.emailFrom);
  return createConsoleMailer();
}
