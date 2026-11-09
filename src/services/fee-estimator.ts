export class FeeEstimator {
  public static readonly BASE_FEE_STROOPS = 100;

  public static estimateFee(operationsCount: number = 1, surgeMultiplier: number = 1.0): number {
    const count = Math.max(1, operationsCount);
    const multiplier = Math.max(1.0, surgeMultiplier);
    return Math.ceil(this.BASE_FEE_STROOPS * count * multiplier);
  }
}
