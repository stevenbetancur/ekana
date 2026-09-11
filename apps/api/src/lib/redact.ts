const REDACTED = 'REDACTED';
const SENSITIVE_QUERY_PARAMS = ['token'];

// Los tokens de verificación y recuperación viajan en la URL: nunca deben quedar en los logs.
export function redactUrl(url: string): string {
  const queryStart = url.indexOf('?');
  const path = queryStart === -1 ? url : url.slice(0, queryStart);
  const safePath = path.replace(/(\/reset-password\/)[^/]+/, `$1${REDACTED}`);
  if (queryStart === -1) return safePath;

  const params = new URLSearchParams(url.slice(queryStart + 1));
  for (const key of SENSITIVE_QUERY_PARAMS) {
    if (params.has(key)) params.set(key, REDACTED);
  }
  return `${safePath}?${params.toString()}`;
}
