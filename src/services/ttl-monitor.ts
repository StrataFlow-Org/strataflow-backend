export type StorageHealthStatus = 'STORAGE_HEALTHY' | 'EXTENSION_RECOMMENDED' | 'CRITICAL_EXTENSION_REQUIRED';

export interface TtlStatus {
  agreementId: bigint;
  liveUntilLedger: number;
  currentLedger: number;
  remainingLedgers: number;
  remainingDays: number;
  needsExtension: boolean;
  recommendedBumpAmount: number;
  healthStatus: StorageHealthStatus;
  actionableRemediation: string;
}

export class TtlMonitorService {
  // Constants reflecting Stellar network ledger rate (~5 seconds per ledger)
  public static readonly DEFAULT_THRESHOLD_LEDGERS = 100_000; // ~5.7 days
  public static readonly CRITICAL_THRESHOLD_LEDGERS = 20_000; // ~1.1 days
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
    const remainingDays = this.ledgersToDays(remainingLedgers);

    let healthStatus: StorageHealthStatus = 'STORAGE_HEALTHY';
    let actionableRemediation = 'Storage TTL is within healthy operating parameters. No action needed.';

    if (remainingLedgers <= this.CRITICAL_THRESHOLD_LEDGERS) {
      healthStatus = 'CRITICAL_EXTENSION_REQUIRED';
      actionableRemediation = `Urgent: Storage TTL will expire within ${remainingDays} days. Invoke bump_agreement_ttl(${agreementId}) immediately to prevent contract state archival.`;
    } else if (needsExtension) {
      healthStatus = 'EXTENSION_RECOMMENDED';
      actionableRemediation = `Storage TTL is approaching the retention boundary (${remainingDays} days remaining). Invoke bump_agreement_ttl(${agreementId}) to extend lifecycle.`;
    }

    return {
      agreementId,
      liveUntilLedger,
      currentLedger,
      remainingLedgers,
      remainingDays,
      needsExtension,
      recommendedBumpAmount,
      healthStatus,
      actionableRemediation,
    };
  }

  public static ledgersToDays(ledgers: number): number {
    // 1 day = 86400 / 5 = 17,280 ledgers
    return Number((ledgers / 17_280).toFixed(2));
  }
}
