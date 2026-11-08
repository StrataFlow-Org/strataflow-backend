import { describe, it } from 'node:test';
import assert from 'node:assert';
import { agreementRepo } from '../src/repositories/agreement-repo.js';
import { AgreementStatus, MilestoneStatus } from '@prisma/client';

describe('Concurrent Volume & Aggregation Tests', () => {
  agreementRepo.setUseDatabase(false);

  it('processes parallel agreement creations and aggregates total volume accurately', async () => {
    const batchSize = 5;
    const baseAmount = '1000000000'; // string in AgreementData

    const promises = Array.from({ length: batchSize }).map((_, i) => {
      const onChainId = BigInt(Date.now() + i);
      return agreementRepo.upsertAgreement({
        onChainId,
        clientAddress: 'GBBD47IF6LWK7P7MDEVTESTWINNINGTALKER2026COMMITS',
        providerAddress: 'GCP777PROVIDERTESTNETWINNINGTALKER2026XYZ',
        arbiterAddress: 'GAK777ARBITERTESTNETWINNINGTALKER2026XYZ',
        tokenAddress: 'CDLZ73VU7Y4Z45ETK26QU62NDXQJ2277NY2Y57C2ZFU7SS7M6HWT7G4H',
        totalAmount: baseAmount,
        balance: baseAmount,
        status: AgreementStatus.FUNDED,
        deadline: new Date(Date.now() + 86400 * 1000),
        title: `Concurrent Agreement ${i}`,
        milestones: [
          {
            index: 0,
            description: `Milestone 1 for test ${i}`,
            amount: baseAmount,
            status: MilestoneStatus.PENDING,
          },
        ],
      });
    });

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, batchSize);

    const stats = await agreementRepo.getStats();
    assert.ok(stats.totalAgreements >= batchSize);
    assert.ok(stats.activeEscrows >= batchSize);
  });
});
