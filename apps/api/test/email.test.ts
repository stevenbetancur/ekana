import { describe, it, expect } from 'vitest';
import { resetPasswordEmail, verificationEmail } from '../src/email/templates.js';

const url = 'http://localhost:8080/api/auth/verify-email?token=abc&callbackURL=%2Fonboarding';

describe('plantillas de correo', () => {
  it('el correo de verificación incluye el enlace en texto y HTML', () => {
    const email = verificationEmail({ name: 'Ana', url });
    expect(email.subject).toBe('Verify your Ekana email');
    expect(email.text).toContain(url);
    expect(email.text).toContain('Hi Ana');
    expect(email.html).toContain(url.replace(/&/g, '&amp;'));
  });

  it('el correo de recuperación indica que expira en 1 hora', () => {
    const email = resetPasswordEmail({ name: 'Ana', url });
    expect(email.subject).toBe('Reset your Ekana password');
    expect(email.text).toContain(url);
    expect(email.text).toContain('1 hour');
  });

  it('escapa el nombre en el HTML', () => {
    const email = verificationEmail({ name: '<script>alert(1)</script>', url });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});
