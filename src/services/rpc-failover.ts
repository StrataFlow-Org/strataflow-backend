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
