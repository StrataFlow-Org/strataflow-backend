export class EventLoopMonitor {
  private lastCheck: number = Date.now();
  private lagMs: number = 0;

  public sample(): number {
    const now = Date.now();
    const delta = now - this.lastCheck;
    this.lastCheck = now;
    // Expected interval vs actual elapsed
    this.lagMs = Math.max(0, delta - 1000);
    return this.lagMs;
  }

  public getLag(): number {
    return this.lagMs;
  }
}
