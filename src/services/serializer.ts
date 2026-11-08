/**
 * Helper to ensure BigInt values serialize properly in JSON responses
 */
export function setupBigIntSerialization(): void {
  // Add toJSON to BigInt prototype if not present
  if (!('toJSON' in BigInt.prototype)) {
    Object.defineProperty(BigInt.prototype, 'toJSON', {
      get() {
        return () => this.toString();
      },
      configurable: true,
      enumerable: false,
    });
  }
}

/**
 * Safely stringify any payload containing BigInt, Date, or circular references
 */
export function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data, (_, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}

