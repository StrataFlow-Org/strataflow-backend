import { timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';

export function timingSafeEqual(a: string | Buffer, b: string | Buffer): boolean {
  const bufA = typeof a === 'string' ? Buffer.from(a, 'utf-8') : a;
  const bufB = typeof b === 'string' ? Buffer.from(b, 'utf-8') : b;

  if (bufA.length !== bufB.length) {
    // Prevent timing disclosure of length mismatch by performing comparison on dummy equal buffers
    cryptoTimingSafeEqual(bufA, bufA);
    return false;
  }

  return cryptoTimingSafeEqual(bufA, bufB);
}
