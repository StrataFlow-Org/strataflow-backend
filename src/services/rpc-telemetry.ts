export interface LatencySample {
  endpoint: string;
  durationMs: number;
  timestamp: number;
}

export class RpcTelemetry {
  private samples: LatencySample[] = [];

  public recordSample(endpoint: string, durationMs: number): void {
    this.samples.push({ endpoint, durationMs, timestamp: Date.now() });
    if (this.samples.length > 500) {
      this.samples.shift();
    }
  }

  public getAverageLatency(endpoint?: string): number {
    const filtered = endpoint ? this.samples.filter(s => s.endpoint === endpoint) : this.samples;
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, s) => acc + s.durationMs, 0);
    return Math.round(sum / filtered.length);
  }
}
