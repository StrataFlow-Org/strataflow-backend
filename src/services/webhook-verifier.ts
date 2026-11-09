import { createHmac } from 'crypto';
import { timingSafeEqual } from '../utils/timing-safe';

export class WebhookVerifier {
  public static computeSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  public static verifySignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp?: number,
    toleranceMs: number = 300000
  ): boolean {
    if (!signature || !secret || !payload) {
      return false;
    }

    if (timestamp !== undefined) {
      const now = Date.now();
      if (Math.abs(now - timestamp) > toleranceMs) {
        return false;
      }
    }

    const expected = this.computeSignature(payload, secret);
    return timingSafeEqual(expected, signature);
  }
}
