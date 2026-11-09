export class DeepPayloadSanitizer {
  private static readonly DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  public static deepSanitize<T>(input: T): T {
    if (input === null || typeof input !== 'object') {
      if (typeof input === 'string') {
        return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') as any;
      }
      return input;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.deepSanitize(item)) as any;
    }

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (!this.DANGEROUS_KEYS.has(key)) {
        clean[key] = this.deepSanitize(value);
      }
    }
    return clean as T;
  }
}
