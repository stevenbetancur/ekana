import { describe, it, expect } from 'vitest';
import { createResendMailer } from '../src/email/mailer.js';

const message = {
  to: 'ana@example.com',
  subject: 'Verify your Ekana email',
  text: 'Hi Ana',
  html: '<p>Hi Ana</p>',
};

function fakeFetch(status: number, body: string) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (url: string | URL, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    return new Response(body, { status });
  }) as unknown as typeof fetch;
  return { calls, impl };
}

describe('createResendMailer', () => {
  it('envía el correo por la API de Resend', async () => {
    const { calls, impl } = fakeFetch(200, '{"id":"e1"}');
    await createResendMailer('re_secreta', 'Ekana <no-reply@ekana.dev>', impl).send(message);

    expect(calls).toHaveLength(1);
    const call = calls.at(0);
    if (!call) throw new Error('Resend no recibió ninguna petición');
    const { url, init } = call;
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer re_secreta');
    expect(JSON.parse(String(init.body))).toEqual({
      from: 'Ekana <no-reply@ekana.dev>',
      to: ['ana@example.com'],
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  });

  it('falla indicando el estado y el detalle, sin filtrar la API key', async () => {
    const { impl } = fakeFetch(422, '{"message":"The from address is not verified"}');
    const error = await createResendMailer('re_secreta', 'Ekana <x@y.z>', impl)
      .send(message)
      .catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('422');
    expect((error as Error).message).toContain('not verified');
    expect((error as Error).message).not.toContain('re_secreta');
  });
});
