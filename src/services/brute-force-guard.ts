export interface AttemptStatus {
  blocked: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
}

export class BruteForceGuard {
  private attempts: Map<string, { count: number; lockedUntil: number }> = new Map();

  constructor(
    private readonly maxAttempts: number = 5,
    private readonly lockoutMultiplierMs: number = 60000
  ) {}

  public recordAttempt(identifier: string, success: boolean): AttemptStatus {
    const now = Date.now();
    let record = this.attempts.get(identifier);

    if (record && record.lockedUntil > now) {
      return {
        blocked: true,
        retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
        remainingAttempts: 0,
      };
    }

    if (success) {
      this.attempts.delete(identifier);
      return { blocked: false, retryAfterSeconds: 0, remainingAttempts: this.maxAttempts };
    }

    const currentCount = (record?.count || 0) + 1;
    let lockedUntil = 0;
    if (currentCount >= this.maxAttempts) {
      const exponent = currentCount - this.maxAttempts + 1;
      lockedUntil = now + this.lockoutMultiplierMs * Math.min(exponent, 10);
    }

    this.attempts.set(identifier, { count: currentCount, lockedUntil });

    return {
      blocked: lockedUntil > now,
      retryAfterSeconds: lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0,
      remainingAttempts: Math.max(0, this.maxAttempts - currentCount),
    };
  }

  public reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}
