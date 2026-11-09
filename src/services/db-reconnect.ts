export class DbReconnectService {
  public static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialBackoffMs: number = 500
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) {
          throw err;
        }
        const delay = initialBackoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Database retry failed unexpectedly');
  }
}
