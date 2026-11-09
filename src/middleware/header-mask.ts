export class HeaderMask {
  private static readonly SENSITIVE_HEADERS = new Set([
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
    'proxy-authorization',
  ]);

  public static maskHeaders(headers: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = {};
    for (const [key, val] of Object.entries(headers)) {
      if (this.SENSITIVE_HEADERS.has(key.toLowerCase())) {
        masked[key] = '[REDACTED]';
      } else {
        masked[key] = val;
      }
    }
    return masked;
  }
}
