import { createHash } from 'crypto';
import { timingSafeEqual } from '../utils/timing-safe';

export class AdminAuthGuard {
  public static hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey.trim()).digest('hex');
  }

  public static validateApiKey(providedApiKey: string, expectedHash: string): boolean {
    if (!providedApiKey || !expectedHash) return false;
    const hashed = this.hashApiKey(providedApiKey);
    return timingSafeEqual(hashed, expectedHash);
  }
}
