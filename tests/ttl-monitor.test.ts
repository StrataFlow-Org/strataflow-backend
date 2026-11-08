import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TtlMonitorService } from '../src/services/ttl-monitor';

describe('TtlMonitorService Unit Tests', () => {
  it('identifies entry that does NOT need extension when well above threshold', () => {
    const currentLedger = 500_000;
    const liveUntilLedger = 900_000; // 400,000 remaining (> 100,000 threshold)

    const status = TtlMonitorService.evaluateTtl(1n, currentLedger, liveUntilLedger);

    assert.strictEqual(status.remainingLedgers, 400_000);
    assert.strictEqual(status.needsExtension, false);
    assert.strictEqual(status.recommendedBumpAmount, 0);
  });

  it('identifies entry that DOES need extension when below threshold', () => {
    const currentLedger = 500_000;
    const liveUntilLedger = 550_000; // 50,000 remaining (<= 100,000 threshold)

    const status = TtlMonitorService.evaluateTtl(1n, currentLedger, liveUntilLedger);

    assert.strictEqual(status.remainingLedgers, 50_000);
    assert.strictEqual(status.needsExtension, true);
    // target is 518,400 - 50,000 = 468,400
    assert.strictEqual(status.recommendedBumpAmount, 468_400);
  });

  it('handles expired entry gracefully with 0 remaining ledgers', () => {
    const currentLedger = 600_000;
    const liveUntilLedger = 590_000; // already expired in past

    const status = TtlMonitorService.evaluateTtl(1n, currentLedger, liveUntilLedger);

    assert.strictEqual(status.remainingLedgers, 0);
    assert.strictEqual(status.needsExtension, true);
    assert.strictEqual(status.recommendedBumpAmount, TtlMonitorService.DEFAULT_TARGET_TTL_LEDGERS);
  });

  it('accurately converts ledger counts to human-readable days', () => {
    // 17,280 ledgers per day
    assert.strictEqual(TtlMonitorService.ledgersToDays(17_280), 1);
    assert.strictEqual(TtlMonitorService.ledgersToDays(518_400), 30);
    assert.strictEqual(TtlMonitorService.ledgersToDays(8_640), 0.5);
  });
});
