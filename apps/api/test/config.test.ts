import { describe, it, expect } from 'vitest';
import { loadConfig, ConfigError } from '../src/config.js';

const base = {
  DB_HOST: 'db.local',
  DB_USER: 'u',
  DB_PASSWORD: 'p',
  DB_NAME: 'ekana',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
};

describe('loadConfig', () => {
  it('aplica valores por defecto', () => {
    const config = loadConfig(base);
    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3000);
    expect(config.host).toBe('::');
    expect(config.corsOrigins).toEqual(['http://localhost:8080']);
    expect(config.rateLimitMax).toBe(300);
    expect(config.db).toEqual({
      host: 'db.local',
      port: 3306,
      user: 'u',
      password: 'p',
      database: 'ekana',
      ssl: true,
      poolSize: 10,
    });
  });

  it('convierte tipos desde strings', () => {
    const config = loadConfig({
      ...base,
      PORT: '8081',
      DB_SSL: 'false',
      CORS_ORIGINS: 'https://a.com, https://b.com',
    });
    expect(config.port).toBe(8081);
    expect(config.db.ssl).toBe(false);
    expect(config.corsOrigins).toEqual(['https://a.com', 'https://b.com']);
  });

  it('falla indicando las variables que faltan', () => {
    expect(() => loadConfig({ DB_USER: 'u' })).toThrow(ConfigError);
    expect(() => loadConfig({ DB_USER: 'u' })).toThrow(/DB_HOST/);
    expect(() => loadConfig({ DB_USER: 'u' })).toThrow(/DB_PASSWORD/);
  });

  it('rechaza un puerto inválido', () => {
    expect(() => loadConfig({ ...base, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('aplica los valores por defecto de auth y correo', () => {
    const config = loadConfig(base);
    expect(config.appUrl).toBe('http://localhost:8080');
    expect(config.auth).toEqual({ secret: 'x'.repeat(32), rateLimitMax: 20 });
    expect(config.smtp).toBeNull();
    expect(config.resendApiKey).toBeNull();
    expect(config.emailFrom).toBe('Ekana <no-reply@localhost>');
  });

  it('configura SMTP solo si host, usuario y contraseña tienen valor', () => {
    const smtpEnv = { SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'a@b.com', SMTP_PASS: 'secret' };
    expect(loadConfig({ ...base, ...smtpEnv }).smtp).toEqual({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: 'a@b.com',
      pass: 'secret',
    });
    expect(loadConfig({ ...base, ...smtpEnv, SMTP_PASS: '' }).smtp).toBeNull();
  });

  it('exige un transporte de correo en producción', () => {
    expect(() => loadConfig({ ...base, NODE_ENV: 'production' })).toThrow(/RESEND_API_KEY/);
  });

  it('acepta producción con Resend o con SMTP completo', () => {
    const prod = { ...base, NODE_ENV: 'production' };
    expect(loadConfig({ ...prod, RESEND_API_KEY: 're_123' }).resendApiKey).toBe('re_123');
    const conSmtp = loadConfig({ ...prod, SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'a@b.com', SMTP_PASS: 'secret' });
    expect(conSmtp.resendApiKey).toBeNull();
    expect(conSmtp.smtp?.host).toBe('smtp.gmail.com');
  });

  it('exige un BETTER_AUTH_SECRET de al menos 32 caracteres', () => {
    expect(() => loadConfig({ ...base, BETTER_AUTH_SECRET: 'corto' })).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('normaliza APP_URL sin barra final', () => {
    expect(loadConfig({ ...base, APP_URL: 'https://ekana-web.vercel.app/' }).appUrl).toBe('https://ekana-web.vercel.app');
  });
});
