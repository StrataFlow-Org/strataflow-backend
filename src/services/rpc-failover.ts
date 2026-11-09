export class RpcFailoverService {
  private rpcUrls: string[];

  constructor(primaryUrl: string, fallbackUrls: string[] = []) {
    this.rpcUrls = [primaryUrl, ...fallbackUrls];
  }

  public async fetchWithFailover(payload: Record<string, unknown>, timeoutMs = 3000): Promise<any> {
    let lastError: Error | null = null;

    for (const url of this.rpcUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (res.ok) {
          return await res.json();
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error('All RPC endpoints failed');
  }
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelayMs = 500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
