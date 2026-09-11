import nodemailer from 'nodemailer';
import type { Config, SmtpConfig } from '../config.js';
import type { EmailContent } from './templates.js';

export interface EmailMessage extends EmailContent {
  to: string;
}

export interface Mailer {
  send(message: EmailMessage): Promise<void>;
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

// Solo desarrollo: config.ts exige SMTP en producción.
export function createConsoleMailer(log: (line: string) => void = console.info): Mailer {
  return {
    async send(message) {
      log(`\n[email] Para: ${message.to}\n[email] Asunto: ${message.subject}\n${message.text}\n`);
    },
  };
}

export function createMailer(config: Config): Mailer {
  return config.smtp ? createSmtpMailer(config.smtp, config.emailFrom) : createConsoleMailer();
}
