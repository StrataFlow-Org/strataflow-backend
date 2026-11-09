export class NonceTracker {
  private nonces: Map<string, number> = new Map();

  public consumeNonce(nonce: string, ttlMs: number = 300000): boolean {
    const now = Date.now();
    this.cleanup(now);

    if (this.nonces.has(nonce)) {
      return false; // Replay detected!
    }

    this.nonces.set(nonce, now + ttlMs);
    return true;
  }

  public hasNonce(nonce: string): boolean {
    const exp = this.nonces.get(nonce);
    if (!exp) return false;
    if (Date.now() > exp) {
      this.nonces.delete(nonce);
      return false;
    }
    return true;
  }

  public cleanup(now: number = Date.now()): number {
    let evicted = 0;
    for (const [nonce, expiresAt] of this.nonces.entries()) {
      if (now > expiresAt) {
        this.nonces.delete(nonce);
        evicted++;
      }
    }
    return evicted;
  }
}
