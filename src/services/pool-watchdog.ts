export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

export class PoolWatchdog {
  public static evaluatePoolHealth(stats: PoolStats, maxSaturationPercentage: number = 85): { healthy: boolean; saturation: number } {
    if (stats.totalCount === 0) return { healthy: true, saturation: 0 };
    const active = stats.totalCount - stats.idleCount;
    const saturation = Math.round((active / stats.totalCount) * 100);
    return {
      healthy: saturation < maxSaturationPercentage && stats.waitingCount === 0,
      saturation,
    };
  }
}
