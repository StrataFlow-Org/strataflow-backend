import { createHash } from 'crypto';

export class PreimageGuard {
  private usedPreimages: Set<string> = new Set();

  public verifyAndConsume(preimage: string, expectedHash: string): boolean {
    const hash = createHash('sha256').update(preimage).digest('hex');
    if (hash.toLowerCase() !== expectedHash.toLowerCase()) {
      return false;
    }

    if (this.usedPreimages.has(hash)) {
      return false; // Replay prevention
    }

    this.usedPreimages.add(hash);
    return true;
  }
}
