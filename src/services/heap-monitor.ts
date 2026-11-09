export class HeapMonitor {
  public static getHeapUsagePercentage(): number {
    const mem = process.memoryUsage();
    return Math.round((mem.heapUsed / mem.heapTotal) * 100);
  }

  public static isMemoryCritical(thresholdPercentage: number = 90): boolean {
    return this.getHeapUsagePercentage() >= thresholdPercentage;
  }
}
