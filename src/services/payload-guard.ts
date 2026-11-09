export class PayloadGuard {
  public static readonly DEFAULT_MAX_BYTES = 1048576; // 1 MB

  public static isWithinLimit(byteLength: number, maxBytes: number = this.DEFAULT_MAX_BYTES): boolean {
    return byteLength > 0 && byteLength <= maxBytes;
  }

  public static parseContentLength(headerValue?: string | number): number | null {
    if (headerValue === undefined || headerValue === null) return null;
    const parsed = typeof headerValue === 'number' ? headerValue : parseInt(headerValue, 10);
    return isNaN(parsed) || parsed < 0 ? null : parsed;
  }
}
