export class LogSanitizer {
  private static readonly STELLAR_SECRET_REGEX = /S[A-Z0-9]{55}/g;
  private static readonly JWT_REGEX = /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g;
  private static readonly DB_PASS_REGEX = /:\/\/[^:]+:([^@]+)@/g;

  public static sanitizeString(input: string): string {
    return input
      .replace(this.STELLAR_SECRET_REGEX, '[REDACTED_STELLAR_SECRET]')
      .replace(this.JWT_REGEX, '[REDACTED_JWT_TOKEN]')
      .replace(this.DB_PASS_REGEX, '://user:[REDACTED_PASSWORD]@');
  }

  public static sanitizeObject<T>(obj: T): T {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? (this.sanitizeString(obj) as any) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item)) as any;
    }

    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (['password', 'secret', 'apiKey', 'token', 'privateKey'].includes(key.toLowerCase())) {
        cleaned[key] = '[REDACTED]';
      } else {
        cleaned[key] = this.sanitizeObject(val);
      }
    }
    return cleaned as T;
  }
}
