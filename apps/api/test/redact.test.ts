import { describe, it, expect } from 'vitest';
import { redactUrl } from '../src/lib/redact.js';

describe('redactUrl', () => {
  it('oculta el token de verificación y conserva el resto de la query', () => {
    expect(redactUrl('/api/auth/verify-email?token=eyJ.secreto.abc&callbackURL=%2Fonboarding')).toBe(
      '/api/auth/verify-email?token=REDACTED&callbackURL=%2Fonboarding',
    );
  });

  it('oculta el token de recuperación que viaja en la ruta', () => {
    expect(redactUrl('/api/auth/reset-password/abc123?callbackURL=%2Fauth%2Freset-password')).toBe(
      '/api/auth/reset-password/REDACTED?callbackURL=%2Fauth%2Freset-password',
    );
  });

  it('no modifica URLs sin datos sensibles', () => {
    expect(redactUrl('/api/v1/profiles')).toBe('/api/v1/profiles');
    expect(redactUrl('/api/auth/reset-password')).toBe('/api/auth/reset-password');
    expect(redactUrl('/api/v1/profiles?limit=10')).toBe('/api/v1/profiles?limit=10');
  });
});
