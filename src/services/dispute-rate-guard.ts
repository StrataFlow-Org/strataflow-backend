export class DisputeRateGuard {
  private filings: Map<string, number[]> = new Map();

  constructor(
    private readonly maxFilingsPerDay: number = 3,
    private readonly windowMs: number = 86400000
  ) {}

  public canFileDispute(participantAddress: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let history = this.filings.get(participantAddress) || [];
    history = history.filter(ts => ts > cutoff);

    if (history.length >= this.maxFilingsPerDay) {
      return false;
    }

    history.push(now);
    this.filings.set(participantAddress, history);
    return true;
  }

  public getRemainingFilings(participantAddress: string): number {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const history = (this.filings.get(participantAddress) || []).filter(ts => ts > cutoff);
    return Math.max(0, this.maxFilingsPerDay - history.length);
  }
}
