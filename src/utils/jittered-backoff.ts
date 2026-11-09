export class JitteredBackoff {
  public static calculate(attempt: number, baseMs: number = 200, maxMs: number = 10000): number {
    const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
    // Full jitter pattern: random number between 0 and exponential ceiling
    return Math.floor(Math.random() * exponential);
  }
}
