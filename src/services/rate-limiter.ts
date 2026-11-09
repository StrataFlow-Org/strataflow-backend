export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export class SlidingWindowRateLimiter {
  private windows: Map<string, number[]> = new Map();

  constructor(private readonly windowMs: number = 60000, private readonly maxRequests: number = 100) {}

  public isAllowed(key: string, limit: number = this.maxRequests, windowMs: number = this.windowMs): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.windows.get(key) || [];
    timestamps = timestamps.filter(ts => ts > windowStart);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      const resetMs = oldest ? oldest + windowMs - now : windowMs;
      this.windows.set(key, timestamps);
      return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
    }

    timestamps.push(now);
    this.windows.set(key, timestamps);
    return {
      allowed: true,
      remaining: limit - timestamps.length,
      resetMs: windowMs,
    };
  }

  public reset(key?: string): void {
    if (key) {
      this.windows.delete(key);
    } else {
      this.windows.clear();
    }
  }
}
