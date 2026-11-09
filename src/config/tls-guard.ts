export class TlsGuard {
  public static readonly ALLOWED_PROTOCOLS = new Set(['TLSv1.2', 'TLSv1.3']);

  public static isProtocolAllowed(protocol?: string): boolean {
    if (!protocol) return false;
    return this.ALLOWED_PROTOCOLS.has(protocol);
  }

  public static validateCipherSuite(cipher?: string): boolean {
    if (!cipher) return false;
    // Reject known weak or insecure cipher suites
    const weakPatterns = [/RC4/i, /DES/i, /MD5/i, /NULL/i, /EXPORT/i, /anon/i];
    return !weakPatterns.some(pattern => pattern.test(cipher));
  }
}
