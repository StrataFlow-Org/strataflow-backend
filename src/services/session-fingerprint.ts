import { createHash } from 'crypto';

export interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
  acceptLanguage?: string;
}

export class SessionFingerprintService {
  public static generateFingerprint(context: SessionContext): string {
    const raw = `${context.userAgent || 'unknown'}|${context.ipAddress || 'unknown'}|${context.acceptLanguage || 'unknown'}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  public static validateFingerprint(context: SessionContext, expectedHash: string): boolean {
    const calculated = this.generateFingerprint(context);
    return calculated === expectedHash;
  }
}
