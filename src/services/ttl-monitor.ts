export interface TtlStatus {
  agreementId: bigint;
  liveUntilLedger: number;
  currentLedger: number;
  remainingLedgers: number;
  needsExtension: boolean;
  recommendedBumpAmount: number;
}

export class TtlMonitorService {
  // Constants reflecting Stellar network ledger rate (~5 seconds per ledger)
  public static readonly DEFAULT_THRESHOLD_LEDGERS = 100_000; // ~5.7 days
  public static readonly DEFAULT_TARGET_TTL_LEDGERS = 518_400; // ~30 days

  public static evaluateTtl(
    agreementId: bigint,
    currentLedger: number,
    liveUntilLedger: number,
    thresholdLedgers: number = this.DEFAULT_THRESHOLD_LEDGERS,
    targetLedgers: number = this.DEFAULT_TARGET_TTL_LEDGERS
  ): TtlStatus {
    const remainingLedgers = Math.max(0, liveUntilLedger - currentLedger);
    const needsExtension = remainingLedgers <= thresholdLedgers;
    const recommendedBumpAmount = needsExtension ? Math.max(0, targetLedgers - remainingLedgers) : 0;

    return {
      agreementId,
      liveUntilLedger,
      currentLedger,
      remainingLedgers,
      needsExtension,
      recommendedBumpAmount,
    };
  }

  public static ledgersToDays(ledgers: number): number {
    // 1 day = 86400 / 5 = 17,280 ledgers
    return Number((ledgers / 17_280).toFixed(2));
  }
}
